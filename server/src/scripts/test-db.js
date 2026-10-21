import { pool } from "../models/db.js";

async function testDatabase() {
  try {
    const result = await pool.query(`
      SELECT
        current_database() AS database_name,
        current_user AS database_user,
        extname AS vector_extension
      FROM pg_extension
      WHERE extname = 'vector'
    `);

    console.log("Database connection successful.");
    console.log("Database:", result.rows[0]?.database_name);
    console.log("Vector extension:", result.rows[0]?.vector_extension);

    const vectorTest = await pool.query(`
      SELECT '[1, 0, 0]'::vector <=> '[1, 0, 0]'::vector
        AS cosine_distance
    `);

    console.log(
      "Vector operation successful:",
      vectorTest.rows[0].cosine_distance,
    );
  } catch (error) {
    console.error("Database test failed:", error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

testDatabase();
