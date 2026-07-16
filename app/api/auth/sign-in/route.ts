import { prisma } from "@/app/lib/prisma";
import { SESSION_COOKIE_NAME } from "@/app/lib/auth";
import { createSession } from "@/app/lib/session";
import { signInSessionToken } from "@/app/lib/jwt";
import { signinSchema } from "@/validations/auth";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const validation = signinSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                {
                    message: "Fill in required fields",
                    error: validation.error.flatten(),
                },
                { status: 400 }
            );
        }

        const { email, password } = validation.data;

        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return NextResponse.json(
                { message: "Invalid email or password" },
                { status: 401 }
            );
        }

        const passwordMatches = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatches) {
            return NextResponse.json(
                { message: "Invalid email or password" },
                { status: 401 }
            );
        }

        const session = await createSession(user.id);
        const token = signInSessionToken(session.id);

        const cookieStore = await cookies();

        cookieStore.set({
            name: SESSION_COOKIE_NAME,
            value: token,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24 * 30,
        });

        return NextResponse.json(
            {
                message: "Signed in successfully",
                user: {
                    id: user.id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    role: user.role,
                },
            },
            { status: 200 }
        );
    } catch {
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}