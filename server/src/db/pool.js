import { Pool } from "pg";
import { pgConfig } from "../config/db.js";

export const pool =
  globalThis.__pgPool ?? (globalThis.__pgPool = new Pool(pgConfig));

if (process.env.NODE_ENV !== "test") {
  pool
    .query("SELECT NOW()")
    .then((res) => console.log("DB connected at", res.rows[0].now))
    .catch((err) => console.error("DB connection error:", err));
}

export const query = (text, params) => pool.query(text, params);
export default pool;