# Fail-closed comparison memo (Day 1, Module 2, Lab 2)

Participant deliverable. Compares `services/fulfillment-service/src/paths/confirm-shipment.ts` against `services/shipment-analytics/src/report.ts`.

## Path A: shipment confirmation (`confirm-shipment.ts`)

**One-sentence fail-closed statement:**

> If ______________________ fails, the shipment is _____________ (not confirmed), because _____________.

**What fail-closed costs this path, concretely:**

## Path B: shipment analytics reporting (`report.ts`)

**Why fail-open is right here:**

**Where the line would move** — name one concrete requirement change that would flip this path to fail-closed:

## The general rule you're deriving

State the actual decision rule for "when is fail-closed correct," derived from these two paths.

## Self-check

- [ ] Both one-sentence statements are actually one sentence.
- [ ] The availability cost for Path A is a concrete scenario, not "some downtime."
- [ ] The "where the line moves" answer for Path B names a specific trigger.
