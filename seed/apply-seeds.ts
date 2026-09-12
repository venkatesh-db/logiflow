import { getDb, runMigrations } from "@logiflow/shared-db";

runMigrations();
const db = getDb();

const carriers = [
  { id: "carrier-swift", name: "SwiftShip", daily_capacity: 500, sla_days: 1, serves_regions: ["west", "central"] },
  { id: "carrier-value", name: "ValueFreight", daily_capacity: 800, sla_days: 3, serves_regions: ["west", "east", "central"] },
  { id: "carrier-regional", name: "RegionalExpress", daily_capacity: 200, sla_days: 2, serves_regions: ["east"] },
];

const insert = db.prepare(
  `INSERT OR IGNORE INTO carriers (id, name, daily_capacity, sla_days, serves_regions) VALUES (@id, @name, @daily_capacity, @sla_days, @serves_regions)`
);
for (const c of carriers) insert.run({ ...c, serves_regions: JSON.stringify(c.serves_regions) });

console.log(`Seeded ${carriers.length} carriers. See seed-manifest.md for the 10 planted decisions/defects/scenarios.`);
