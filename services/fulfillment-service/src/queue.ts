import { getDb } from "@logiflow/shared-db";

/** Chaos hook: when true, every enqueue() call throws — used by chaos scripts and Lab 2. */
export function isQueueDown(): boolean {
  return process.env.LOGIFLOW_QUEUE_DOWN === "1";
}

export function enqueue(queue: "dispatch" | "analytics", shipmentId: string, payload: Record<string, unknown>): void {
  if (isQueueDown()) {
    throw new Error(`queue "${queue}" is unavailable`);
  }
  getDb()
    .prepare(`INSERT INTO queue_messages (queue, shipment_id, payload) VALUES (?, ?, ?)`)
    .run(queue, shipmentId, JSON.stringify(payload));
}
