import type { Client } from "@libsql/client";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";

function loadMigrationFiles(): string[] {
  const dir = join(process.cwd(), "migrations");
  return readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort();
}

async function ensureMigrationsTable(client: Client): Promise<void> {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS _schema_migrations (
      name TEXT PRIMARY KEY,
      applied_at INTEGER NOT NULL
    )
  `);
}

async function isMigrationApplied(client: Client, name: string): Promise<boolean> {
  const res = await client.execute({
    sql: "SELECT 1 FROM _schema_migrations WHERE name = ? LIMIT 1",
    args: [name],
  });
  return res.rows.length > 0;
}

/**
 * Existing databases created before migration tracking: mark prior migrations
 * as applied so seed SQL (INSERT OR IGNORE) does not re-run on every deploy.
 */
async function stampLegacyDatabase(client: Client, files: string[]): Promise<void> {
  const applied = await client.execute("SELECT COUNT(*) AS c FROM _schema_migrations");
  if (Number((applied.rows[0] as Record<string, unknown>).c) > 0) return;

  const ventures = await client.execute("SELECT 1 FROM ventures LIMIT 1");
  if (ventures.rows.length === 0) return;

  const now = Date.now();
  for (const file of files) {
    if (file === "006_reference_cleanup.sql") continue;
    await client.execute({
      sql: "INSERT OR IGNORE INTO _schema_migrations (name, applied_at) VALUES (?, ?)",
      args: [file, now],
    });
  }
}

export async function runMigrations(client: Client): Promise<void> {
  await ensureMigrationsTable(client);
  const files = loadMigrationFiles();
  await stampLegacyDatabase(client, files);

  const dir = join(process.cwd(), "migrations");
  for (const file of files) {
    if (await isMigrationApplied(client, file)) continue;

    const sql = readFileSync(join(dir, file), "utf-8");
    await client.executeMultiple(sql);
    await client.execute({
      sql: "INSERT INTO _schema_migrations (name, applied_at) VALUES (?, ?)",
      args: [file, Date.now()],
    });
  }
}
