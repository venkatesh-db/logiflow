# Audit design — worked example: `issue_credit`

Filled in against the real, running path in `services/ops-mcp-server`.

## What a compliance reviewer needs to reconstruct an incident

| Question | Answered by |
|---|---|
| Who attempted this? | `actor` |
| What exactly did they try to do? | `tool` + `args_json` |
| Was it allowed or denied? | `decision` |
| Why? | `reason` |
| Which enforcement point decided? | `path` |
| When? | `created_at` |

## Known gap in the current implementation

SEED-L06 (see `seed-manifest.md`): a malformed call can throw inside the gate *before* `writeAudit()` runs, leaving **zero** trace of the attempt. Treat this as a governance requirement, not a code-quality nit.

## What "good" looks like for a new control point

1. Every gate write happens on both branches (allowed and denied).
2. `args_json` is validated, not just serialized — a malformed call still produces a row.
3. The `reason` field is specific enough that a reviewer doesn't need to read the code.
4. Retention: state explicitly how long `audit_log` rows are kept and where — this repo doesn't implement retention/archival; say so rather than staying silent.
