export const SESSION_COOKIE = "bbc_session";
export const SESSION_TTL_MS = 60 * 60 * 24 * 30 * 1000; // 30 days

const TOKEN_VERSION = "v2";

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "SESSION_SECRET must be set in production. Generate one with: openssl rand -base64 32"
    );
  }
  return "dev-insecure-secret-change-me";
}

async function hmacHex(payload: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}

/** Token format: v2.<userId>.<expiresAtMs>.<hmac(payload)> */
export async function createSessionToken(userId: string): Promise<string> {
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const payload = `${TOKEN_VERSION}.${userId}.${expiresAt}`;
  const sig = await hmacHex(payload, getSecret());
  return `${payload}.${sig}`;
}

/** Returns the user id for a valid, unexpired token; null otherwise. */
export async function verifySessionToken(token: string | undefined): Promise<string | null> {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 4) return null;
  const [version, userId, expiresAtStr, sig] = parts;
  if (version !== TOKEN_VERSION || !userId) return null;
  const expiresAt = Number(expiresAtStr);
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return null;
  const expected = await hmacHex(`${version}.${userId}.${expiresAtStr}`, getSecret());
  if (!timingSafeEqual(sig, expected)) return null;
  return userId;
}
