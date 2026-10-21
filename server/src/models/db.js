import pg from "pg";
import { config } from "../config/env.js";

const { Pool } = pg;

if (!config.databaseUrl) {
  throw new Error("DATABASE_URL is not configured");
}

export const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl: { rejectUnauthorized: true },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on("error", (err) => {
  console.error("Unexpected idle PostgreSQL client error:", err);
});

export async function initializeDatabase() {
  const client = await pool.connect();

  try {
    await client.query("SELECT 1");
    console.log("Connected to Neon PostgreSQL");
  } finally {
    client.release();
  }
}
