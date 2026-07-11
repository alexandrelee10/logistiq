import { cookies } from "next/headers";

// TODO: replace with real session/token verification once the auth/token
// system is built. For now this just checks for the presence of a cookie.
const SESSION_COOKIE_NAME = "logistiq_session";

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  return Boolean(cookieStore.get(SESSION_COOKIE_NAME)?.value);
}

export { SESSION_COOKIE_NAME };
