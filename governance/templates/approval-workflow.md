# Approval-workflow specification — worked example

| Profile | Example in this repo | Approval requirement |
|---|---|---|
| **Interactive task** | A warehouse ops staffer runs `issue_credit` by hand via `ops-mcp-server` | Structural gate only (amount cap) — attributable, single action already captured in `audit_log` |
| **Reviewed batch** | The Day 3 CI review gate posting findings on a PR | Findings are advisory-only by design; a human must read the PR comment and approve the merge; the job has no merge/write permission |
| **Fully unattended job** | Hypothetical: an overnight batch auto-requeuing all `failed` shipments | NOT currently implemented in this repo, and should not be built without: (1) a stop condition, (2) independent verification, (3) a rollback trigger, (4) a human-approval gate for anything beyond a pre-approved blast radius |

## The actual gap in this repo

`adjust_inventory` and `issue_credit` currently have **no distinction** between an interactive call and a batch/unattended call — the same structural gate applies regardless of caller type. A real governance package would need a `callerType` dimension to `ToolCall` and stricter approval for non-interactive callers. This is unbuilt — flag it as a known limitation, don't silently assume it's handled.
