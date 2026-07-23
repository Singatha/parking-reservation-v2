import { pool } from "./pool.js";

const spaces = [
  ["A-01", "standard", "Central Parkade", "1 Main Road", 20],
  ["A-02", "accessible", "Central Parkade", "1 Main Road", 20],
  ["B-14", "ev", "Riverside Offices", "24 River Street", 35],
  ["C-07", "motorcycle", "Market Square", "8 Market Lane", 12],
  ["D-03", "oversized", "Station Garage", "100 Station Road", 30]
];

try {
  for (const space of spaces) {
    await pool.execute(
      `INSERT INTO parking_spaces (code, type, building_name, address, hourly_price)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         type = VALUES(type),
         building_name = VALUES(building_name),
         address = VALUES(address),
         hourly_price = VALUES(hourly_price),
         active = TRUE`,
      space
    );
  }
  console.log(`Seeded ${spaces.length} parking spaces`);
} finally {
  await pool.end();
}
