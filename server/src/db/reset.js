import pool from "./pool.js";
import init from "./init.js";

if (process.env.NODE_ENV === "production") {
  throw new Error("Refusing to reset schema in production.");
}

async function reset() {
  console.log("Resetting schema...");
  await pool.query(`
    DROP SCHEMA IF EXISTS public CASCADE;
    CREATE SCHEMA public;
    GRANT ALL ON SCHEMA public TO PUBLIC;
  `);
  console.log("Schema reset.");
}

(async () => {
  try {
    await reset();     
    await init();     
  } catch (e) {
    console.error("db:reset failed:", e);
    process.exitCode = 1;
  } finally {
    await pool.end();  
  }
})();