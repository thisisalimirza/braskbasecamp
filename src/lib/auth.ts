export const SESSION_COOKIE = "bbc_session";
const SESSION_PAYLOAD = "authenticated";

function getSecret(): string {
  return process.env.SESSION_SECRET || "dev-insecure-secret-change-me";
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

export function checkPassword(input: string): boolean {
  const expected = process.env.APP_PASSWORD || "changeme";
  return timingSafeEqual(input, expected);
}

export async function createSessionToken(): Promise<string> {
  const sig = await hmacHex(SESSION_PAYLOAD, getSecret());
  return `${SESSION_PAYLOAD}.${sig}`;
}

export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const dot = token.lastIndexOf(".");
  if (dot < 0) return false;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (payload !== SESSION_PAYLOAD) return false;
  const expected = await hmacHex(payload, getSecret());
  return timingSafeEqual(sig, expected);
}
