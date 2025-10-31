import mysql from "mysql2/promise";
import { env } from "../../config/env";
import { logger } from "../logging/logger";

export const pool = mysql.createPool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  connectionLimit: 10,
  charset: "utf8mb4",
  supportBigNumbers: true
});

export async function healthcheck() {
  try {
    const [rows] = await pool.query("SELECT 1 AS ok");
    return (rows as any)[0]?.ok === 1;
  } catch (e) {
    logger.error(e, "DB healthcheck failed");
    return false;
  }
}
