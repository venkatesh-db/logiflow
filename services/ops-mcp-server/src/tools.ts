import { getDb } from "@logiflow/shared-db";
import { enforce, type ToolCall } from "./hooks/permission-gate.js";

export function callTool(call: ToolCall): { result: unknown } | { error: string } {
  const decision = enforce(call, "ops-mcp-server/tools.callTool");
  if (!decision.allowed) return { error: decision.reason };

  const db = getDb();
  switch (call.tool) {
    case "lookup_shipment":
      return { result: db.prepare("SELECT * FROM shipments WHERE id = ?").get(call.args.shipmentId) };

    case "adjust_inventory":
      // Simulated inventory adjustment — no real WMS integration in this training system.
      return { result: { adjusted: true, sku: call.args.sku, delta: call.args.delta } };

    case "issue_credit":
      // Simulated credit issuance — no real payment integration.
      return { result: { credited: call.args.amount, shipmentId: call.args.shipmentId } };

    case "relabel_package":
      db.prepare("UPDATE shipments SET sku = ? WHERE id = ?").run(call.args.sku, call.args.shipmentId);
      return { result: { relabeled: true } };

    case "cancel_shipment":
      db.prepare("UPDATE shipments SET status = 'cancelled' WHERE id = ?").run(call.args.shipmentId);
      return { result: { cancelled: true } };

    default:
      return { error: `unknown tool: ${(call as ToolCall).tool}` };
  }
}
