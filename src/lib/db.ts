import { createClient, type Client } from "@libsql/client";
import { runMigrations } from "./migrate-runner";

declare global {
  var __bbcDbClient: Client | undefined;
  var __bbcDbMigrated: Promise<void> | undefined;
}

function makeClient(): Client {
  const url = process.env.TURSO_DATABASE_URL ?? "file:./local.db";
  const authToken = process.env.TURSO_AUTH_TOKEN;
  return createClient({ url, authToken });
}

export async function getDb(): Promise<Client> {
  if (!global.__bbcDbClient) {
    global.__bbcDbClient = makeClient();
  }
  if (!global.__bbcDbMigrated) {
    global.__bbcDbMigrated = runMigrations(global.__bbcDbClient);
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
