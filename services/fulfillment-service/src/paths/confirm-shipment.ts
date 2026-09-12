import { getDb } from "@logiflow/shared-db";
import { enqueue } from "../queue.js";

/**
 * LOCK-CRITICAL WRITE PATH — fail-closed by design.
 *
 * Confirming a shipment is the point where warehouse staff physically hand
 * the package to the assigned carrier. If the downstream analytics enqueue
 * fails, the confirmation is rolled back and the shipment is marked
 * `blocked`, not `confirmed` — a shipment silently marked confirmed with no
 * record of the handoff is worse than one stuck a little longer in
 * `dispatched`, because warehouse staff and the customer-facing tracking
 * page would both be told the package moved when it may not have.
 */
export function confirmShipment(shipmentId: string): { status: string } {
  const db = getDb();
  const shipment = db.prepare("SELECT * FROM shipments WHERE id = ?").get(shipmentId) as
    | { id: string; status: string }
    | undefined;

  if (!shipment) throw new Error(`shipment ${shipmentId} not found`);
  if (shipment.status !== "dispatched") {
    throw new Error(`shipment ${shipmentId} must be dispatched before it can be confirmed (was ${shipment.status})`);
  }

  const tx = db.transaction(() => {
    try {
      enqueue("analytics", shipmentId, { event: "shipment_confirmed" });
    } catch (err) {
      db.prepare("UPDATE shipments SET status = 'blocked' WHERE id = ?").run(shipmentId);
      throw err;
    }
    db.prepare("UPDATE shipments SET status = 'confirmed', confirmed_at = datetime('now') WHERE id = ?").run(
      shipmentId
    );
  });

  tx();
  return { status: "confirmed" };
}
