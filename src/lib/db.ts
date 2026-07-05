import { createClient, type Client } from "@libsql/client";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";

declare global {
  var __bbcDbClient: Client | undefined;
  var __bbcDbMigrated: Promise<void> | undefined;
}

function makeClient(): Client {
  const url = process.env.TURSO_DATABASE_URL ?? "file:./local.db";
  const authToken = process.env.TURSO_AUTH_TOKEN;
  return createClient({ url, authToken });
}

function loadMigrations(): string[] {
  const dir = join(process.cwd(), "migrations");
  return readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .map((f) => readFileSync(join(dir, f), "utf-8"));
}

async function migrate(client: Client): Promise<void> {
  const migrations = loadMigrations();
  for (const sql of migrations) {
    await client.executeMultiple(sql);
  }
}

export async function getDb(): Promise<Client> {
  if (!global.__bbcDbClient) {
    global.__bbcDbClient = makeClient();
  }
  if (!global.__bbcDbMigrated) {
    global.__bbcDbMigrated = migrate(global.__bbcDbClient);
  }
  await global.__bbcDbMigrated;
  return global.__bbcDbClient;
}

export function newId(): string {
  return crypto.randomUUID();
}

export function nowMs(): number {
  return Date.now();
}
