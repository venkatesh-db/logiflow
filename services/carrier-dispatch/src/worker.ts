import { getDb } from "@logiflow/shared-db";

interface Carrier {
  id: string;
  name: string;
  daily_capacity: number;
  sla_days: number;
  serves_regions: string;
}

/**
 * SEED-L05: this handler does not check whether the shipment has already
 * been dispatched before processing a "dispatch" message. On an
 * at-least-once queue, a redelivered message (e.g. after a worker crash
 * mid-ack, as chaos/incident-1.sh triggers) causes the SAME shipment to be
 * dispatched to a carrier twice. Left in deliberately — a Day 4 finding,
 * not a bug to "fix" before the course runs.
 *
 * SEED-L01 (see seed-manifest.md): among eligible carriers, this ALWAYS
 * picks the lowest-SLA (fastest) one deterministically — never
 * capacity-aware, never randomized, never diversified. This is a genuine,
 * two-sided supply-chain trade-off: single-carrier concentration on the
 * fastest option optimizes customer-facing delivery time and is simple to
 * reason about, but it creates carrier dependency risk (one carrier's
 * outage or rate hike affects 100% of a region's volume) and forfeits any
 * negotiating leverage that comes from spreading volume across carriers.
 * Do not "fix" this before the course runs — arguing this trade-off is
 * the Day 1 lab content.
 */
function dispatchShipment(shipmentId: string): void {
  const db = getDb();
  const shipment = db.prepare("SELECT * FROM shipments WHERE id = ?").get(shipmentId) as
    | { id: string; region: string }
    | undefined;
  if (!shipment) return;

  const carriers = db.prepare("SELECT * FROM carriers").all() as Carrier[];
  const eligible = carriers
    .filter((c) => JSON.parse(c.serves_regions).includes(shipment.region))
    .sort((a, b) => a.sla_days - b.sla_days);

  if (eligible.length === 0) {
    db.prepare("UPDATE shipments SET status = 'blocked' WHERE id = ?").run(shipmentId);
    return;
  }

  const chosen = eligible[0];
  db.prepare("UPDATE shipments SET carrier_id = ?, status = 'dispatched' WHERE id = ?").run(chosen.id, shipmentId);
  db.prepare(`INSERT INTO analytics_events (event_type, shipment_id, payload) VALUES ('shipment_dispatched', ?, ?)`).run(
    shipmentId,
    JSON.stringify({ carrierId: chosen.id })
  );
}

function pollOnce(): void {
  const db = getDb();
  const messages = db
    .prepare("SELECT * FROM queue_messages WHERE queue = 'dispatch' AND status = 'pending' LIMIT 10")
    .all() as { id: number; shipment_id: string }[];

  for (const msg of messages) {
    db.prepare("UPDATE queue_messages SET status = 'processing', attempt_count = attempt_count + 1 WHERE id = ?").run(
      msg.id
    );
    try {
      dispatchShipment(msg.shipment_id);
      db.prepare("UPDATE queue_messages SET status = 'done', processed_at = datetime('now') WHERE id = ?").run(
        msg.id
      );
    } catch (err) {
      console.error(`failed to dispatch shipment ${msg.shipment_id}`, err);
      db.prepare("UPDATE queue_messages SET status = 'failed' WHERE id = ?").run(msg.id);
    }
  }
}

const intervalMs = Number(process.env.CARRIER_DISPATCH_POLL_MS ?? 500);
console.log(`carrier-dispatch polling every ${intervalMs}ms`);
setInterval(pollOnce, intervalMs);
