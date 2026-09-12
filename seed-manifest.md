---
name: seed-manifest-logiflow
description: The 10 planted decisions/defects/scenarios in LogiFlow, mapped to the day/lab that uses each. Second reference system — rotates with RxFlow between cohorts.
metadata:
  type: project
---

# LogiFlow seed manifest

Instructor-facing. Participants are never handed this file directly.

**Design note**: RxFlow's first release had a miscalibrated seed (SEED-001, "random lab routing") that an independent review found to be one-sided rather than genuinely debatable — the "simplicity" side had no real argument behind it. Every ambiguous-decision seed below was designed with a real, defensible argument on *both* sides from the start, not retrofitted after the fact. If you (or a fresh reviewer) find one of these one-sided too, fix it the same way: don't just assert both sides are equal, verify a genuine argument exists for each.

| ID | Category | Location | Intended finding | Correct fix / answer | Used by |
|----|----------|----------|-------------------|------------------------|---------|
| SEED-L01 | Ambiguous architectural decision | `services/carrier-dispatch/src/worker.ts` — `dispatchShipment` | Carrier selection deterministically picks the lowest-SLA (fastest) eligible carrier for every shipment — no capacity awareness, no diversification. This is a genuine single-sourcing vs. multi-sourcing supply-chain trade-off (real industry debate, not invented for this course): fastest-carrier-always optimizes customer delivery time and is simple to reason about; it also concentrates 100% of a region's volume on one carrier (outage risk, no negotiating leverage from split volume). | Defensible either way — correct answer names BOTH the delivery-time benefit and the concentration-risk cost concretely, using this system's actual carrier data (e.g., "west" region is 100% SwiftShip under current rules), and picks one with justification. | Day 1, Module 1 |
| SEED-L02 | Security / permission gap | `services/ops-mcp-server/src/hooks/permission-gate.ts` — `issue_credit` gate | Checks the $300 amount cap but never verifies `call.actor` owns/services the shipment's warehouse — any actor can issue a credit against any warehouse's shipment. | Add an ownership check: look up the shipment's `warehouse_id` and compare to the actor's authorized warehouse(s) before allowing. | Day 2, Module 4 |
| SEED-L03 | Fail-closed — correct | `services/fulfillment-service/src/paths/confirm-shipment.ts` | Confirm path is fail-closed: an enqueue failure rolls back the confirmation and marks the shipment `blocked`. Correct default for this path. | No fix needed — argue why, naming the concrete cost (a shipment falsely marked confirmed with no analytics record of the physical handoff). | Day 1, Module 2, Lab 2 |
| SEED-L04 | Fail-open — correct | `services/shipment-analytics/src/report.ts` | Malformed messages logged and dropped, never block the queue. | No fix needed — argue why, and name where the line would move (e.g., if this feed became billing-relevant for carrier invoicing reconciliation). | Day 1, Module 2, Lab 2 |
| SEED-L05 | Defect — idempotency gap | `services/carrier-dispatch/src/worker.ts` — `dispatchShipment` | No check for "already dispatched" before processing a dispatch message; a redelivered message double-dispatches the same shipment to a carrier. | Guard on `shipment.status !== 'pending'` (or a processed-message dedupe table) before dispatching. | Day 4 — exploited by `chaos/incident-1.sh` |
| SEED-L06 | Missing audit coverage | `services/ops-mcp-server/src/hooks/permission-gate.ts` — gate functions read `call.args` fields directly with no existence check | A tool call with `args` missing entirely throws inside the gate, before `enforce()` reaches `writeAudit()` — zero audit rows written for the attempt. Same root cause as RxFlow's SEED-006, reproduced independently here to confirm it's a pattern worth teaching generally, not a one-off. | Validate `call.args` has the tool's required keys in `enforce()` before invoking the gate; write a `denied`/`malformed-request` row if not. | Day 2, Module 4 |
| SEED-L07 | Enforcement-budget question | `services/ops-mcp-server/src/hooks/permission-gate.ts` — `relabel_package` and `lookup_shipment` are advisory only | Should `relabel_package` (mislabeling a package post-confirmation is a physical, hard-to-reverse error) swap in for one of the three structural slots? | Defensible either way — same shape of trade-off as RxFlow's SEED-007 (physical-error cost vs. systemic-overload risk), different domain. | Day 1, Module 1, Lab 1 |
| SEED-L08 | Incident scenario — cascading | Triggered by `chaos/incident-1.sh` | Worker crash mid-ack on `carrier-dispatch` (exploiting SEED-L05) causes duplicate dispatch, which spikes `analytics_events` inserts for one shipment. | Correct timeline: worker crash → duplicate dispatch (SEED-L05) → two `shipment_dispatched` analytics events for one shipment. | Day 4, Lab 8 |
| SEED-L09 | Incident scenario — variant (unannounced) | Triggered by `chaos/incident-2.sh` | Fulfillment intake is fail-closed end-to-end (rolls back on enqueue failure), so a queue outage produces zero shipment rows, not a visible "blocked" status — while an unrelated retrying client trips `adjust_inventory`'s rate-limit gate simultaneously, producing noise that looks alarming but isn't the incident. | Root cause is "zero shipments were created during the outage window," not the rate-limit denials. | Day 4 assessment (unannounced variant) |
| SEED-L10 | Golden-task reference scenario | Composite of SEED-L02 + SEED-L05 | "Find the credit-scoping gap AND the dispatch idempotency gap in one pass" with a known-good reference outcome. | Reference outcome in `golden-tasks/tasks/task-05-composite-review.yaml` (adapt from RxFlow's task-05 pattern). | Day 5, Lab 9 |

## Verification status

- SEED-L02: reproduced live via direct tool call (see below).
- SEED-L05: `chaos/incident-1.sh` reliably reproduces duplicate dispatch.
- SEED-L06: reproduced via a malformed tool call, confirmed zero new `audit_log` rows.
- SEED-L01/L07: design points, not runtime bugs — no independent-review pass has checked these yet (unlike RxFlow's equivalents). **Run one before relying on these for a cohort's Day 1 peer-review assessment** — do not assume they're calibrated correctly just because RxFlow's were, after a review, found sound.
