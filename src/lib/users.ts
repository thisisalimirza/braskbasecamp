import { getDb, newId, nowMs } from "./db";
import { hashPassword, verifyPassword } from "./password";

export type User = {
  id: string;
  email: string;
  name: string;
  createdAt: number;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MIN_PASSWORD_LENGTH = 8;

function rowToUser(row: Record<string, unknown>): User {
  return {
    id: String(row.id),
    email: String(row.email),
    name: String(row.name),
    createdAt: Number(row.created_at),
  };
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function getUserById(id: string): Promise<User | null> {
  const db = await getDb();
  const res = await db.execute({
    sql: "SELECT id, email, name, created_at FROM users WHERE id = ?",
    args: [id],
  });
  if (res.rows.length === 0) return null;
  return rowToUser(res.rows[0] as Record<string, unknown>);
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const db = await getDb();
  const res = await db.execute({
    sql: "SELECT id, email, name, created_at FROM users WHERE email = ?",
    args: [normalizeEmail(email)],
  });
  if (res.rows.length === 0) return null;
  return rowToUser(res.rows[0] as Record<string, unknown>);
}

export type RegisterResult =
  | { ok: true; user: User }
  | { ok: false; error: "invalid_email" | "weak_password" | "email_taken" | "missing_name" };

export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
}): Promise<RegisterResult> {
  const name = input.name.trim();
  const email = normalizeEmail(input.email);

  if (!name) return { ok: false, error: "missing_name" };
  if (!EMAIL_RE.test(email)) return { ok: false, error: "invalid_email" };
  if (input.password.length < MIN_PASSWORD_LENGTH) return { ok: false, error: "weak_password" };

  const db = await getDb();
  const existing = await getUserByEmail(email);
  if (existing) return { ok: false, error: "email_taken" };

  const id = newId();
  const passwordHash = await hashPassword(input.password);
  try {
    await db.execute({
      sql: "INSERT INTO users (id, email, name, password_hash, created_at) VALUES (?, ?, ?, ?, ?)",
      args: [id, email, name, passwordHash, nowMs()],
    });
  } catch (e) {
    if (/unique/i.test(e instanceof Error ? e.message : String(e))) {
      return { ok: false, error: "email_taken" };
    }
    throw e;
  }

  await claimLegacyDataIfFirstUser(id);

  const user = await getUserById(id);
  if (!user) throw new Error("Failed to create account");
  return { ok: true, user };
}

export async function verifyCredentials(email: string, password: string): Promise<User | null> {
  const db = await getDb();
  const res = await db.execute({
    sql: "SELECT * FROM users WHERE email = ?",
    args: [normalizeEmail(email)],
  });
  if (res.rows.length === 0) return null;
  const row = res.rows[0] as Record<string, unknown>;
  const valid = await verifyPassword(password, String(row.password_hash));
  if (!valid) return null;
  return rowToUser(row);
}

/**
 * Data created before multi-user support has user_id = NULL. The first
 * account ever registered claims it so the original owner keeps their
 * ventures, money history, and settings.
 */
async function claimLegacyDataIfFirstUser(userId: string): Promise<void> {
  const db = await getDb();
  const count = await db.execute("SELECT COUNT(*) AS c FROM users");
  if (Number((count.rows[0] as Record<string, unknown>).c) !== 1) return;

  const tables = ["ventures", "clients", "pnl_entries", "reference_facts", "reference_links"];
  await db.batch(
    [
      ...tables.map((table) => ({
        sql: `UPDATE ${table} SET user_id = ? WHERE user_id IS NULL`,
        args: [userId],
      })),
      // Carry over pre-multi-user app settings (e.g. hard WIP limits).
      // The `WHERE true` disambiguates SELECT + ON CONFLICT for SQLite's parser.
      {
        sql: `INSERT INTO user_settings (user_id, key, value, updated_at)
              SELECT ?, key, value, updated_at FROM app_settings WHERE true
              ON CONFLICT(user_id, key) DO NOTHING`,
        args: [userId],
      },
    ],
    "write"
  );
}
