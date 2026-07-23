import mysql from "mysql2/promise";
import { config } from "../config.js";

export const pool = mysql.createPool({
  host: config.DATABASE_HOST,
  port: config.DATABASE_PORT,
  database: config.DATABASE_NAME,
  user: config.DATABASE_USER,
  password: config.DATABASE_PASSWORD,
  connectionLimit: 10,
  waitForConnections: true,
  timezone: "Z",
  decimalNumbers: true
});
