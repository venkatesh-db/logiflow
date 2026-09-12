#!/usr/bin/env bash
# Day 4 assessment — UNANNOUNCED variant. Do not show this script or its
# comments to participants beforehand. Same root-cause CLASS as incident-1
# (a symptom masking the real failure), different shape: a retrying client
# hammers adjust_inventory fast enough to trip the rate-limit gate
# repeatedly, right as a genuine, unrelated queue outage blocks real
# shipment intake entirely (SEED-L09).
set -euo pipefail
cd "$(dirname "$0")/.."

echo "=== Incident-2: starting from a clean DB ==="
npm run reset > /dev/null

echo "=== Starting fulfillment-service with the queue forced down (the real incident) ==="
LOGIFLOW_QUEUE_DOWN=1 npm run dev:fulfillment-service > /tmp/logiflow-fulfillment2.log 2>&1 &
FULFILLMENT_PID=$!
trap 'kill '"$FULFILLMENT_PID"' 2>/dev/null || true' EXIT
sleep 2

echo "=== A customer's order fails at intake because the queue is down ==="
curl -s -X POST localhost:4101/shipments -H 'content-type: application/json' \
  -d '{"customerName":"Retry Storm Customer","sku":"WIDGET-2","region":"east","warehouseId":"wh-2"}' || true
echo ""

echo "=== Meanwhile: a misbehaving client retries adjust_inventory 10x in a burst ==="
for i in $(seq 1 10); do
  echo '{"actor":"retry-client","tool":"adjust_inventory","args":{"sku":"WIDGET-2","delta":-1}}' \
    | npx tsx services/ops-mcp-server/src/server.ts > /dev/null 2>&1
done

echo "=== Symptom check ==="
npx tsx chaos/check-incident-2.ts
