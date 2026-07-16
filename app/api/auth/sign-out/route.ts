import { SESSION_COOKIE_NAME } from "@/app/lib/auth";
import { verifySessionToken } from "@/app/lib/jwt";
import { deleteSession } from "@/app/lib/session";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
    const cookieStore = await cookies();

    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (token) {
        const decoded = verifySessionToken(token);

        if (decoded) {
            await deleteSession(decoded.sid);
        }
    }

    cookieStore.delete(SESSION_COOKIE_NAME);

    return NextResponse.json(
        { message: "Signed out successfully" },
        { status: 200 }
    );
}