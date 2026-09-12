import { getDb } from "@logiflow/shared-db";

const db = getDb();
const rateLimitDenials = db
  .prepare(`SELECT COUNT(*) as n FROM audit_log WHERE tool = 'adjust_inventory' AND decision = 'denied'`)
  .get() as { n: number };
const totalShipments = db.prepare(`SELECT COUNT(*) as n FROM shipments`).get() as { n: number };

console.log(
  JSON.stringify(
    {
      rateLimitDenials: rateLimitDenials.n,
      totalShipmentsCreated: totalShipments.n,
      correctDiagnosis:
        rateLimitDenials.n > 0 && totalShipments.n === 0
          ? "the real incident is that ZERO shipments exist — intake is fail-closed and rejected every attempt while the queue was down. The rate-limit denials are a separate, working-as-designed control on an unrelated retry client — don't mistake that noise for the root cause."
          : "incident did not reproduce as expected",
    },
    null,
    2
  )
);
