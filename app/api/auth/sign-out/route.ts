import { SESSION_COOKIE_NAME } from "@/app/lib/auth";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);

  return NextResponse.json({ message: "Signed out successfully" }, { status: 200 });
}
