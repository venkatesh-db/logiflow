import { getDb } from "@logiflow/shared-db";

/**
 * READ-ONLY, DOWNSTREAM PATH — fail-open by design.
 *
 * A dropped or malformed analytics message means an on-time-delivery
 * dashboard is a few minutes stale — no customer's package is affected.
 * Blocking the dispatch pipeline on analytics availability would trade a
 * real failure (delayed shipments) for a cosmetic one (a stale chart).
 * Errors here are logged and skipped, never re-thrown.
 */
function processMessage(msg: { id: number; shipment_id: string; payload: string }): void {
  try {
    const payload = JSON.parse(msg.payload);
    getDb()
      .prepare(`INSERT INTO analytics_events (event_type, shipment_id, payload) VALUES (?, ?, ?)`)
      .run(payload.event ?? "unknown", msg.shipment_id, msg.payload);
  } catch (err) {
    console.warn(`shipment-analytics: dropping malformed message ${msg.id}`, err);
  }
}

function pollOnce(): void {
  const db = getDb();
  const messages = db
    .prepare("SELECT * FROM queue_messages WHERE queue = 'analytics' AND status = 'pending' LIMIT 20")
    .all() as { id: number; shipment_id: string; payload: string }[];

  for (const msg of messages) {
    processMessage(msg);
    db.prepare("UPDATE queue_messages SET status = 'done', processed_at = datetime('now') WHERE id = ?").run(msg.id);
  }
}

const intervalMs = Number(process.env.SHIPMENT_ANALYTICS_POLL_MS ?? 1000);
console.log(`shipment-analytics polling every ${intervalMs}ms`);
setInterval(pollOnce, intervalMs);
