import { getDb } from "@logiflow/shared-db";

const shipmentId = process.argv[2];
if (!shipmentId) {
  console.error("usage: tsx check-duplicate-dispatch.ts <shipmentId>");
  process.exit(1);
}

const events = getDb()
  .prepare(`SELECT COUNT(*) as n FROM analytics_events WHERE event_type = 'shipment_dispatched' AND shipment_id = ?`)
  .get(shipmentId) as { n: number };

console.log(JSON.stringify({ shipmentId, shipment_dispatched_events: events.n, duplicateConfirmed: events.n > 1 }));
process.exit(events.n > 1 ? 0 : 1);
