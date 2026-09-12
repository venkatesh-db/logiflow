-- LogiFlow schema. SQLite stands in for Postgres/a real broker so the course runs with zero external infra.

CREATE TABLE IF NOT EXISTS carriers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  daily_capacity INTEGER NOT NULL,
  sla_days INTEGER NOT NULL,
  serves_regions TEXT NOT NULL -- JSON array
);

CREATE TABLE IF NOT EXISTS shipments (
  id TEXT PRIMARY KEY,
  customer_name TEXT NOT NULL,
  sku TEXT NOT NULL,
  region TEXT NOT NULL,
  warehouse_id TEXT NOT NULL,
  carrier_id TEXT REFERENCES carriers(id),
  status TEXT NOT NULL DEFAULT 'pending', -- pending -> dispatched -> confirmed -> delivered | blocked | cancelled
  idempotency_key TEXT UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  confirmed_at TEXT
);

-- Stands in for a real broker (SQS/Redis). carrier-dispatch and shipment-analytics poll this.
CREATE TABLE IF NOT EXISTS queue_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  queue TEXT NOT NULL,           -- 'dispatch' | 'analytics'
  shipment_id TEXT NOT NULL,
  payload TEXT NOT NULL,         -- JSON
  status TEXT NOT NULL DEFAULT 'pending', -- pending -> processing -> done | failed
  attempt_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  processed_at TEXT
);

CREATE TABLE IF NOT EXISTS analytics_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL,
  shipment_id TEXT,
  payload TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Written on BOTH the allowed and the blocked path for every gated MCP tool call.
CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor TEXT NOT NULL,
  tool TEXT NOT NULL,
  args_json TEXT NOT NULL,
  decision TEXT NOT NULL,   -- 'allowed' | 'denied'
  reason TEXT NOT NULL,
  path TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
