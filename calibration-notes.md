---
name: calibration-notes-logiflow
description: Findings from LogiFlow's technical dry run, before the first real cohort.
metadata:
  type: project
---

# Technical dry run — findings

Same discipline as RxFlow's Phase 6: verify every claim in this repo's docs against actual runtime behavior, from a clean install, not by re-reading the code.

## What was run and verified (fresh `npm install`, clean DB)

- Every file referenced by `docs/facilitator-runbook.md`, `README.md`, and `seed-manifest.md` confirmed to exist.
- Full shipment lifecycle: create → dispatch → confirm (fail-closed) → analytics event. ✅
- `chaos/incident-1.sh` (SEED-L05 exploit): reproduced reliably — 2 `shipment_dispatched` analytics events for one shipment. ✅
- `chaos/incident-2.sh` (unannounced variant): reproduced reliably — zero shipments created under a forced queue outage, 5 rate-limit denials from an unrelated retry client. ✅
- `chaos/reset.sh`: confirmed idempotent, restores clean DB. ✅
- SEED-L02 (credit ownership gap): reproduced live again. ✅
- SEED-L06 (audit-trail gap): reproduced live again — malformed call throws before `writeAudit`. ✅
- `golden-tasks/run-eval.sh`: all 8 tasks parse and run correctly against an arbitrary command. ✅
- `.github/workflows/pr-review.yml`: verified live against a real GitHub PR (see git history) — separate from this dry run, but recorded here for completeness.

## Bugs found

**None.** Unlike RxFlow's original Phase 6 (which found and fixed a real unhandled-exception crash on the order-intake route, plus a wrong assumption in an incident's symptom-check script), this dry run found no equivalent issues in LogiFlow. This is expected, not a sign the dry run was less thorough: LogiFlow's fail-closed intake and correct symptom-check logic were built in from the start, carrying forward RxFlow's fixes, rather than being discovered fresh here.

## Not yet done (owed before first real cohort)

- **Full timed five-day human run-through** — same gap as RxFlow. Days 1, 2, and 4's labs need a second person.
- **SEED-L01/L07 have had one independent-review pass** (see `seed-manifest.md`) — both passed, but a second opinion before a cohort's Day 1 peer-review assessment would match RxFlow's eventual two-pass discipline.

## Versioning

This repo should be tagged once the human dry-run is complete, matching RxFlow's `v1.0` convention. Not yet tagged.
