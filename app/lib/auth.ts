import { cookies } from "next/headers";
import { getValidSession, verifySessionToken } from "./jwt";
import { prisma } from "./prisma";


const SESSION_COOKIE_NAME = "logistiq_session";

// Authentication Check 
export async function isAuthenticated(): Promise<boolean> {
  return Boolean(getCurrentUser());
}

export { SESSION_COOKIE_NAME };

// Get current User
export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) return null;

  const decoded = verifySessionToken(token);
  if (!decoded) return null;

  const session = await getValidSession(decoded.sid);
  if (!session) return null;

  return prisma.user.findUnique({ where: { id: session.userId } });
}
