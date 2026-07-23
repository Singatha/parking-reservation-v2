import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const migrationPath = path.resolve(testDirectory, "../../src/database/migrations/001_initial.sql");

function connectionConfig(database) {
  return {
    host: process.env.DATABASE_HOST,
    port: Number(process.env.DATABASE_PORT),
    user: "root",
    password: process.env.DATABASE_ROOT_PASSWORD,
    database,
    multipleStatements: true
  };
}

export async function setup() {
  const databaseName = process.env.DATABASE_NAME;
  if (!databaseName.endsWith("_test")) {
    throw new Error(`Refusing to recreate non-test database: ${databaseName}`);
  }

  const root = await mysql.createConnection(connectionConfig());
  try {
    await root.query(`DROP DATABASE IF EXISTS \`${databaseName}\``);
    await root.query(`CREATE DATABASE \`${databaseName}\``);
    await root.query(
      `GRANT ALL PRIVILEGES ON \`${databaseName}\`.* TO ?@'%'`,
      [process.env.DATABASE_USER]
    );
  } finally {
    await root.end();
  }

  const database = await mysql.createConnection(connectionConfig(databaseName));
  try {
    const migration = await fs.readFile(migrationPath, "utf8");
    await database.query(migration);
  } finally {
    await database.end();
  }
}

export async function teardown() {
  const databaseName = process.env.DATABASE_NAME;
  if (!databaseName.endsWith("_test")) return;

  const root = await mysql.createConnection(connectionConfig());
  try {
    await root.query(`DROP DATABASE IF EXISTS \`${databaseName}\``);
  } finally {
    await root.end();
  }
}
