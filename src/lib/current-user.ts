import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySessionToken, SESSION_COOKIE } from "./auth";
import { getUserById, type User } from "./users";

/**
 * Resolves the signed-in user from the session cookie, once per request.
 * Returns null when there is no valid session or the user no longer exists.
 */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const jar = await cookies();
  const userId = await verifySessionToken(jar.get(SESSION_COOKIE)?.value);
  if (!userId) return null;
  return getUserById(userId);
});

/** Auth gate for the data layer: every query is scoped to this user id. */
export async function requireUserId(): Promise<string> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user.id;
}

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
