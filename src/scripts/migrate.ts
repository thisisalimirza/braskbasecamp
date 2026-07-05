import { createClient } from "@libsql/client";
import { runMigrations } from "../lib/migrate-runner";

async function main() {
  const url = process.env.TURSO_DATABASE_URL ?? "file:./local.db";
  const client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
  await runMigrations(client);
  console.log("Migrations complete.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
