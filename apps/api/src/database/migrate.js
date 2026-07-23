import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";
import { config } from "../config.js";

const directory = path.join(path.dirname(fileURLToPath(import.meta.url)), "migrations");
const connection = await mysql.createConnection({
  host: config.DATABASE_HOST,
  port: config.DATABASE_PORT,
  database: config.DATABASE_NAME,
  user: config.DATABASE_USER,
  password: config.DATABASE_PASSWORD,
  multipleStatements: true
});

try {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const files = (await fs.readdir(directory)).filter((file) => file.endsWith(".sql")).sort();
  for (const filename of files) {
    const [rows] = await connection.execute(
      "SELECT filename FROM schema_migrations WHERE filename = ?",
      [filename]
    );
    if (rows.length) continue;

    const sql = await fs.readFile(path.join(directory, filename), "utf8");
    await connection.beginTransaction();
    try {
      await connection.query(sql);
      await connection.execute("INSERT INTO schema_migrations (filename) VALUES (?)", [filename]);
      await connection.commit();
      console.log(`Applied migration ${filename}`);
    } catch (error) {
      await connection.rollback();
      throw error;
    }
  }
} finally {
  await connection.end();
}
