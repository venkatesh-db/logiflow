import { getDb, writeAudit } from "@logiflow/shared-db";

export interface ToolCall {
  actor: string;
  tool: "lookup_shipment" | "adjust_inventory" | "issue_credit" | "relabel_package" | "cancel_shipment";
  args: Record<string, unknown>;
}

export type Gate = (call: ToolCall) => { allowed: boolean; reason: string };

/**
 * ENFORCEMENT BUDGET (SEED-L07, see seed-manifest.md): three tools get a
 * structural, hook-enforced gate. Everything else is advisory only —
 * stated in docs/mcp-tool-policy.md, not enforced in code. Structurally
 * enforced: adjust_inventory (rate limit), cancel_shipment (reason
 * required), issue_credit (amount cap + ownership scoping).
 *
 * `relabel_package` is deliberately left advisory, not an oversight — but
 * the case is genuinely closer than the other two exclusions:
 *   FOR promoting it: relabeling a confirmed shipment is a physical,
 *   hard-to-reverse error (the package may already be on a truck).
 *   AGAINST: unlike the three structural checks (a count, a non-empty
 *   string, a numeric cap — all O(1), stateless checks), blocking a
 *   relabel requires a stateful lookup of shipment status, AND relabeling
 *   is the one tool here used for legitimate low-frequency operational
 *   fixes (a customer's address correction, a damaged label) where a hard
 *   gate risks blocking a corrective action that isn't the problem. If
 *   this were high-volume in practice, that argument weakens — this
 *   system doesn't model relabel_package's real call volume, so the
 *   "advisory is fine because it's rare" side is an assumption, not
 *   evidenced data. Name that explicitly if you argue this side.
 */
const gates: Partial<Record<ToolCall["tool"], Gate>> = {
  adjust_inventory: (call) => {
    const db = getDb();
    const recent = db
      .prepare(
        `SELECT COUNT(*) as n FROM audit_log WHERE tool = 'adjust_inventory' AND actor = ? AND decision = 'allowed' AND created_at > datetime('now', '-1 minutes')`
      )
      .get(call.actor) as { n: number };
    if (recent.n >= 5) {
      return { allowed: false, reason: "rate limit: more than 5 inventory adjustments in the last minute" };
    }
    return { allowed: true, reason: "within rate limit" };
  },

  cancel_shipment: (call) => {
    if (!call.args.reason || String(call.args.reason).trim().length === 0) {
      return { allowed: false, reason: "cancel_shipment requires a non-empty reason" };
    }
    return { allowed: true, reason: "reason provided" };
  },

  /**
   * SEED-L02: this gate checks the amount cap but never verifies that
   * `call.actor` actually owns/services the shipment's warehouse — any
   * authenticated actor can issue a credit against ANY warehouse's
   * shipment, not just their own. Planted gap for the Day 2 red-team lab.
   */
  issue_credit: (call) => {
    const amount = Number(call.args.amount ?? 0);
    if (amount > 300) {
      return { allowed: false, reason: "credit exceeds $300 structural cap" };
    }
    return { allowed: true, reason: "within credit cap" };
  },
};

/** Runs the gate for `call.tool` if one is registered, and writes the audit entry on both branches. */
export function enforce(call: ToolCall, path: string): { allowed: boolean; reason: string } {
  const gate = gates[call.tool];
  const result = gate ? gate(call) : { allowed: true, reason: "advisory only — no structural gate" };

  writeAudit({
    actor: call.actor,
    tool: call.tool,
    args: call.args,
    decision: result.allowed ? "allowed" : "denied",
    reason: result.reason,
    path,
  });

  return result;
}
