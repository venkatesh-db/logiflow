# ops-mcp-server tool policy (LogiFlow)

Five tools, three structurally enforced.

| Tool | Structural (hook-enforced) | Advisory only |
|------|----|----|
| `lookup_shipment` | — | Read-only; no gate. |
| `adjust_inventory` | Rate limit: 5/minute per actor | — |
| `issue_credit` | $300 amount cap | — (ownership scoping is *intended* to be structural — see SEED-L02 in `seed-manifest.md`) |
| `relabel_package` | — | Docs say: don't relabel a `confirmed` shipment. Nothing in code stops it. |
| `cancel_shipment` | Requires non-empty `reason` | — |

Every call is written to `audit_log` via `writeAudit()`, allowed or denied, structural or advisory.
