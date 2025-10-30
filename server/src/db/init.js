import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import pool from "./pool.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runSql(fileRelativePath) {
  const full = path.join(__dirname, fileRelativePath);
  const sql = await fs.readFile(full, "utf8");
  await pool.query(sql);
}

async function init() {
  console.log("Applying schema (db.sql)...");
  await runSql("db.sql");

  console.log("Seeding base data (seed.sql)...");
  await runSql("seed.sql");

  console.log("Running scripted seed (seed.js)...");
  const { default: seed } = await import("./seed.js");
  if (typeof seed === "function") {
    await seed();
  }

  console.log("Database initialized.");
}

const isDirectRun =
  process.argv[1] &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isDirectRun) {
  init()
    .catch((err) => {
      console.error("db:init failed:", err);
      process.exitCode = 1;
    })
    .finally(async () => {
      await pool.end();
    });
}

export default init;
