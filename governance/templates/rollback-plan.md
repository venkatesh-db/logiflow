# Rollback plan — worked example: the riskiest write path in scope

Riskiest write in this repo: `services/ops-mcp-server` → `issue_credit`, because it has real downstream effect and — per SEED-L02 — can currently be triggered against the wrong warehouse's shipment.

## What "undo" actually means here

A credit is not cleanly reversible once simulated/processed. `issue_credit` in `services/ops-mcp-server/src/tools.ts` doesn't persist any monetary state at all — no ledger table is written; only `audit_log` records the attempt. There is nothing in the database to "undo" — the entire reversal has to happen externally (a real accounting system, a human-issued correction), which needs the same authorization checks as the original action.

## Rollback plan for a wrongly-authorized credit (exploiting SEED-L02 before it's fixed)

1. **Detect**: query `audit_log` for `tool = 'issue_credit'` rows where the `actor`'s known warehouse doesn't match the shipment's `warehouse_id` (requires joining against `shipments`).
2. **Contain**: apply the SEED-L02 fix (ownership scoping) immediately.
3. **Reverse**: a human, not automation, must decide the reversal action — this is a business decision with real customer impact.
4. **Record**: write a new `audit_log` entry for the reversal itself, citing the original bad transaction's row id.

## For the carrier-dispatch path (SEED-L05)

`dispatchShipment` in `services/carrier-dispatch/src/worker.ts` writes an `analytics_events` row on every call, so the two `shipment_dispatched` events' `created_at` ordering tells you exactly which routing decision happened first and second — reconstruct the timeline from that before touching anything.

**What this repo does NOT let you verify, and shouldn't be assumed as fact from the code alone**: whether the physical carrier has already diverged from the database (e.g., one carrier's driver already picked up the package before the duplicate was caught). Nothing in this codebase models a physical carrier system, a notification, or a webhook — `dispatchShipment` only ever talks to this repo's own database. Treat "the database and physical reality may have diverged" as a **domain risk you're importing from real-world logistics operations knowledge**, not something confirmable from `analytics_events` alone — and say so explicitly in your own rollback plan, rather than presenting it as evidenced by the system when it isn't.
