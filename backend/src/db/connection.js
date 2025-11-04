import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
  host: process.env.POSTGRES_HOST || "localhost",
  port: parseInt(process.env.POSTGRES_PORT || "5432"),
  user: process.env.POSTGRES_USER || "syntegra",
  password: process.env.POSTGRES_PASSWORD || "syntegra",
  database: process.env.POSTGRES_DB || "syntegra",
});

pool.on("error", (err) => {
  console.error("❌ Database error:", err);
});

export default pool;
