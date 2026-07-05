import { createClient } from "@libsql/client";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";

async function main() {
  const url = process.env.TURSO_DATABASE_URL ?? "file:./local.db";
  const client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });

  const dir = join(process.cwd(), "migrations");
  const files = readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const sql = readFileSync(join(dir, file), "utf-8");
    console.log(`Running ${file}...`);
    await client.executeMultiple(sql);
  }

  console.log("Migrations complete.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
