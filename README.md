# LogiFlow

Warehouse Fulfillment and Carrier Dispatch Platform — the **second** reference system for the FDE Intermediate-to-Advanced course. Rotates with [RxFlow](https://github.com/venkatesh-db/rxflow) between cohorts so a repeat participant (or a participant who talked to someone from a prior cohort) can't have seen the seeded answers already.

## Why a second reference project

RxFlow's own [facilitator-runbook.md](https://github.com/venkatesh-db/rxflow/blob/main/docs/facilitator-runbook.md) requires recloning from a clean tag between cohorts — but that only protects against a *participant's own* commits leaking forward, not against someone who took the course once and remembers where SEED-002 lives. LogiFlow is a structurally equivalent but domain-different system (logistics vs. optical-lens ordering) so instructors can alternate.

## Architecture

Deliberately parallel to RxFlow's shape — same course-structural requirements, different domain:

- **`services/fulfillment-service`** — API. Shipment intake and the **lock-critical, fail-closed** confirm path.
- **`services/carrier-dispatch`** — worker. Assigns a carrier to each shipment. Contains the seeded idempotency gap (SEED-L05) and the seeded routing trade-off (SEED-L01).
- **`services/shipment-analytics`** — batch job. **Fail-open** by design.
- **`services/ops-mcp-server`** — internal ops tool surface (lookup, adjust inventory, issue credit, relabel package, cancel shipment). Structural hooks on 3 of 5 tools.
- **`packages/shared-db`** — SQLite schema + client shared by all services.

## Setup

```bash
npm install
npm run reset   # migrates schema + seeds 3 carriers
```

## Running services

```bash
npm run dev:fulfillment-service   # :4101
npm run dev:carrier-dispatch
npm run dev:shipment-analytics
```

## Seeded material

`seed-manifest.md` (instructor-facing) lists the 10 planted items. **Read its design note before relying on SEED-L01/L07 for a cohort** — those two "ambiguous decision" seeds have not yet had an independent-review pass (unlike RxFlow's equivalents, where that pass caught and fixed a real miscalibration). Do this before the first cohort run.

## Chaos scripts (Day 4)

`chaos/incident-1.sh` and `chaos/incident-2.sh` — both verified to reproduce reliably (see repo history). `chaos/reset.sh` restores clean state between runs.

## What's reused from RxFlow rather than duplicated

To keep two reference projects maintainable, LogiFlow does **not** have its own copy of:
- The CI review-gate workflow pattern, sub-agent configs, golden-task format, or governance-template structure — copy RxFlow's and adapt file paths/tool names for this domain when a cohort runs Day 3/5 against LogiFlow.
- The facilitator runbook's day-by-day structure — reuse RxFlow's `docs/facilitator-runbook.md` as the script, substituting LogiFlow's seed IDs and file paths where it references RxFlow-specific ones.

## Status

Core system (4 services) built and verified end-to-end. Both chaos incidents reproduce reliably. SEED-L02 (credit ownership gap) and SEED-L06 (audit gap) verified live. SEED-L01/L07 (the two ambiguous-decision seeds) passed an independent-review pass — both genuinely debatable as designed; see `seed-manifest.md`. **Not yet done**: Day 3 CI adaptation, Day 5 golden-task/governance adaptation, facilitator-runbook adaptation, and a technical dry run equivalent to RxFlow's Phase 6.

<!-- CI verification test PR -->
