#!/usr/bin/env node
// Applies pending Prisma migrations, refusing any that would delete data.
//
// `prisma migrate deploy` never resets a database; it only runs migration.sql
// files that have not been applied yet. This guard covers the remaining risk:
// a migration whose SQL itself drops or deletes data. Such a migration is only
// applied when it is named in ALLOW_DESTRUCTIVE_MIGRATIONS (comma-separated).
//
//   node scripts/safe-migrate.mjs           # check, then apply
//   node scripts/safe-migrate.mjs --check   # only report
//
// Exit codes: 0 nothing pending (or applied OK), 10 pending and safe (--check),
// 2 blocked destructive migration, 1 any other failure.
import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import pg from "pg";

const MIGRATIONS_DIR = path.resolve("prisma", "migrations");

const DESTRUCTIVE_PATTERNS = [
  { label: "DROP TABLE", regex: /\bDROP\s+TABLE\b/i },
  { label: "DROP COLUMN", regex: /\bDROP\s+COLUMN\b/i },
  { label: "DROP SCHEMA", regex: /\bDROP\s+SCHEMA\b/i },
  { label: "DROP DATABASE", regex: /\bDROP\s+DATABASE\b/i },
  { label: "TRUNCATE", regex: /\bTRUNCATE\b/i },
  { label: "DELETE FROM", regex: /\bDELETE\s+FROM\b/i },
];

function stripSqlComments(sql) {
  return sql.replace(/\/\*[\s\S]*?\*\//g, "").replace(/--[^\n]*/g, "");
}

function databaseConfig() {
  const raw = String(process.env.DATABASE_URL || "").trim();
  if (!raw) throw new Error("DATABASE_URL is required");

  // node-postgres treats sslmode=require as full certificate verification,
  // which RDS certificates fail; Prisma does not. Match Prisma's behaviour.
  const url = new URL(raw);
  const sslmode = url.searchParams.get("sslmode");
  url.searchParams.delete("sslmode");
  url.searchParams.delete("schema");
  url.searchParams.delete("connection_limit");
  return {
    connectionString: url.toString(),
    ssl: sslmode && sslmode !== "disable" ? { rejectUnauthorized: false } : undefined,
  };
}

async function appliedMigrations() {
  const client = new pg.Client(databaseConfig());
  await client.connect();
  try {
    const result = await client.query(
      "SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL",
    );
    return new Set(result.rows.map((row) => row.migration_name));
  } catch (error) {
    // A brand-new database has no migrations table yet.
    if (error?.code === "42P01") return new Set();
    throw error;
  } finally {
    await client.end();
  }
}

async function localMigrations() {
  const entries = await fs.readdir(MIGRATIONS_DIR, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

async function findDestructive(name) {
  const sql = await fs.readFile(path.join(MIGRATIONS_DIR, name, "migration.sql"), "utf8");
  const code = stripSqlComments(sql);
  return DESTRUCTIVE_PATTERNS.filter(({ regex }) => regex.test(code)).map(({ label }) => label);
}

async function main() {
  const checkOnly = process.argv.includes("--check");
  const allowed = new Set(
    String(process.env.ALLOW_DESTRUCTIVE_MIGRATIONS || "")
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean),
  );

  const applied = await appliedMigrations();
  const pending = (await localMigrations()).filter((name) => !applied.has(name));

  if (pending.length === 0) {
    console.log("No pending migrations.");
    return 0;
  }

  let blocked = false;
  for (const name of pending) {
    const destructive = await findDestructive(name);
    if (destructive.length === 0) {
      console.log(`pending  ${name}`);
    } else if (allowed.has(name)) {
      console.log(`pending  ${name}  (destructive, allowed: ${destructive.join(", ")})`);
    } else {
      console.log(`BLOCKED  ${name}  (${destructive.join(", ")})`);
      blocked = true;
    }
  }

  if (blocked) {
    console.error(
      "Refusing to migrate: a pending migration can delete data. Review it, then set " +
        "ALLOW_DESTRUCTIVE_MIGRATIONS=<migration name> to apply it.",
    );
    return 2;
  }

  if (checkOnly) return 10;

  const npx = process.platform === "win32" ? "npx.cmd" : "npx";
  const result = spawnSync(npx, ["prisma", "migrate", "deploy"], {
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (result.error) throw result.error;
  return result.status ?? 1;
}

main()
  .then((code) => {
    process.exitCode = code;
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
