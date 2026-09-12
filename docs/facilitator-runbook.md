# Facilitator runbook — LogiFlow / FDE Intermediate-to-Advanced

For the instructor running this course, not participants. Adapted from RxFlow's runbook — same day structure, this repo's file paths and seed IDs. Read `seed-manifest.md` before Day 1.

## Before the cohort arrives

1. `git clone` a fresh copy per cohort — never reuse a repo a previous cohort touched.
2. `npm install && npm run reset` — confirm it completes with no errors.
3. Confirm participant machines have Node 20+, and `git`/`gh` access for Day 3.
4. Recruit and brief your Day 1 pairing partner and skeptical-stakeholder/architect roles for the capstone.
5. Do **not** hand participants `seed-manifest.md`, `calibration-notes.md` (once written), or `golden-tasks/tasks/*.yaml`'s `referenceOutcome` blocks.

## Day 1 — Designing and Proving Structural Controls

| Lab | Your move |
|---|---|
| Lab 1 (`docs/templates/enforcement-design-note.md`) | Don't reveal SEED-L07's framing upfront — let participants arrive at a budget independently; a different answer than the shipped one isn't wrong, it's genuinely close per the independent review. |
| Lab 2 (`docs/templates/fail-closed-comparison-memo.md`) | If a participant argues `confirm-shipment.ts` should be fail-open, ask what customer-facing consequence they're accepting — that's the actual skill. |
| Lab 3 (pairing) | Your briefed partner plays uncertain-but-not-hostile. Watch for narrating judgment vs. taking the keyboard. |

## Day 2 — Red-Teaming and the Verification Loop

| Lab | Your move |
|---|---|
| Lab 4 | If someone can't find SEED-L02, ask "did you check `issue_credit` specifically, and who's allowed to call it against whose shipment?" — don't name the gap directly. Run a malformed tool call live if the audit-trail-quality angle (SEED-L06) hasn't surfaced by mid-lab. |
| Lab 5 | Paper-design exercise, no code. Prep 2-3 curveball scenarios per group in advance for the assessment. |

## Day 3 — Sub-Agents, Parallel Review, Headless CI

| Lab | Your move |
|---|---|
| Lab 6 | Uses `.claude/agents/repository-analyst.md`, `control-reviewer.md`, `security-reviewer.md`. Participants write `evidence-auditor.md` themselves. Watch for someone just concatenating outputs instead of adjudicating conflicts. |
| Lab 7 | Push each participant's fork to a real GitHub repo before this lab — `.github/workflows/pr-review.yml`'s scaffolding is adapted from RxFlow's, which was verified live there; verify it again here before relying on it for a cohort (see "Not yet done" below). |
| Assessment | Plant a fresh issue, not one of the 10 in `seed-manifest.md`. |

## Day 4 — Multi-Agent Incident Response

| Lab | Your move |
|---|---|
| Setup | `./chaos/reset.sh` before Lab 8. |
| Lab 8 | Run `./chaos/incident-1.sh` (announced). Time from launch to consolidated timeline — this is your Lab 8 baseline. |
| Assessment | `./chaos/incident-2.sh` (unannounced). Don't preview its comments or `check-incident-2.ts` beforehand. |

## Day 5 — Golden Tasks, Governance, Capstone

| Lab | Your move |
|---|---|
| Lab 9 | `golden-tasks/tasks/*.yaml` (8 tasks) are a reference set — encourage participants to add tasks 9-10 from their own findings. Use `golden-tasks/run-eval.sh` to compare configs. |
| Lab 10 | `governance/templates/*.md` are worked examples against `issue_credit`/`dispatchShipment` — extend the pattern, don't just copy verbatim. |
| Capstone | Needs your stakeholder/architect roles, briefed per the syllabus. |

## After the cohort

- Reclone from a clean tag for the next cohort — don't reuse a repo participants have committed to.
- If a cohort finds a calibration problem, add it to a `calibration-notes.md` here (not yet written — write one after this repo's first real cohort, same as RxFlow's).

## Not yet done (this adaptation, unlike RxFlow's original)

- **Day 3's CI workflow has not been run live against a real GitHub PR yet** — only structurally adapted from RxFlow's verified version. Verify it once before relying on it for a cohort, the same way RxFlow's was verified (see RxFlow's `calibration-notes.md`).
- **No technical dry run equivalent to RxFlow's Phase 6** has been done on this repo yet.
- **No full timed human dry-run** — same gap as RxFlow.
