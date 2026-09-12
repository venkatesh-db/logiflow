import { getDb } from "@logiflow/shared-db";

const shipmentId = process.argv[2];
if (!shipmentId) {
  console.error("usage: tsx inject-duplicate-dispatch.ts <shipmentId>");
  process.exit(1);
}

getDb()
  .prepare(`INSERT INTO queue_messages (queue, shipment_id, payload) VALUES ('dispatch', ?, ?)`)
  .run(shipmentId, JSON.stringify({ event: "shipment_created", redelivered: true }));

console.log(`injected duplicate dispatch message for shipment ${shipmentId}`);
