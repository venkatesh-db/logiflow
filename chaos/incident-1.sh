#!/usr/bin/env bash
# Day 4, Lab 8 — the announced incident. Root cause (don't reveal until after
# the lab): SEED-L05 — carrier-dispatch has no idempotency check, so a
# redelivered dispatch message routes the same shipment to a carrier twice.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "=== Incident-1: starting from a clean DB ==="
npm run reset > /dev/null

echo "=== Starting fulfillment-service and carrier-dispatch in the background ==="
npm run dev:fulfillment-service > /tmp/logiflow-fulfillment.log 2>&1 &
FULFILLMENT_PID=$!
npm run dev:carrier-dispatch > /tmp/logiflow-dispatch.log 2>&1 &
DISPATCH_PID=$!
trap 'kill '"$FULFILLMENT_PID"' '"$DISPATCH_PID"' 2>/dev/null || true' EXIT
sleep 2

echo "=== Creating one shipment (normal flow) ==="
SHIP_JSON=$(curl -s -X POST localhost:4101/shipments -H 'content-type: application/json' \
  -d '{"customerName":"Incident Test Customer","sku":"WIDGET-1","region":"west","warehouseId":"wh-1"}')
SHIP_ID=$(echo "$SHIP_JSON" | python3 -c "import sys,json;print(json.load(sys.stdin)['id'])")
echo "shipment: $SHIP_ID"
sleep 1.5

echo "=== Triggering the fault: injecting a redelivered dispatch message (SEED-L05) ==="
npx tsx chaos/inject-duplicate-dispatch.ts "$SHIP_ID"
sleep 1.5

echo "=== Symptom check ==="
npx tsx chaos/check-duplicate-dispatch.ts "$SHIP_ID" && \
  echo "INCIDENT CONFIRMED: shipment was dispatched more than once (SEED-L05 exploited)." || \
  echo "Incident did not reproduce — investigate before running with a cohort."
