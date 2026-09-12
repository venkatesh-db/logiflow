import express from "express";
import { randomUUID } from "node:crypto";
import { getDb } from "@logiflow/shared-db";
import { confirmShipment } from "./paths/confirm-shipment.js";
import { enqueue } from "./queue.js";

const app = express();
app.use(express.json());

app.post("/shipments", (req, res) => {
  try {
    const { customerName, sku, region, warehouseId, idempotencyKey } = req.body ?? {};
    if (!customerName || !sku || !region || !warehouseId) {
      return res.status(400).json({ error: "customerName, sku, region, warehouseId are required" });
    }

    const db = getDb();
    if (idempotencyKey) {
      const existing = db.prepare("SELECT * FROM shipments WHERE idempotency_key = ?").get(idempotencyKey);
      if (existing) return res.status(200).json(existing);
    }

    const id = randomUUID();
    db.prepare(
      `INSERT INTO shipments (id, customer_name, sku, region, warehouse_id, idempotency_key) VALUES (?, ?, ?, ?, ?, ?)`
    ).run(id, customerName, sku, region, warehouseId, idempotencyKey ?? null);

    try {
      enqueue("dispatch", id, { event: "shipment_created" });
    } catch (err) {
      db.prepare("DELETE FROM shipments WHERE id = ?").run(id);
      throw err;
    }

    res.status(201).json(db.prepare("SELECT * FROM shipments WHERE id = ?").get(id));
  } catch (err) {
    console.error("POST /shipments failed", err);
    res.status(503).json({ error: "shipment intake temporarily unavailable", message: (err as Error).message });
  }
});

app.get("/shipments/:id", (req, res) => {
  try {
    const shipment = getDb().prepare("SELECT * FROM shipments WHERE id = ?").get(req.params.id);
    if (!shipment) return res.status(404).json({ error: "not found" });
    res.json(shipment);
  } catch (err) {
    console.error("GET /shipments/:id failed", err);
    res.status(500).json({ error: "internal error", message: (err as Error).message });
  }
});

app.post("/shipments/:id/confirm", (req, res) => {
  try {
    res.json(confirmShipment(req.params.id));
  } catch (err) {
    res.status(409).json({ error: (err as Error).message });
  }
});

const port = Number(process.env.FULFILLMENT_SERVICE_PORT ?? 4101);
app.listen(port, () => console.log(`fulfillment-service listening on :${port}`));
