import { prisma } from "@/app/lib/prisma";
import { signupSchema } from "@/validations/auth";
import { slugify } from "@/app/lib/slug";
import { SESSION_COOKIE_NAME } from "@/app/lib/auth";
import { createSession } from "@/app/lib/session";
import { signInSessionToken } from "@/app/lib/jwt";
import { env } from "@/app/lib/env";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { cookies } from "next/headers";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const validation = signupSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { message: "Fill in required fields", error: validation.error.flatten() },
                { status: 400 }
            );
        }

        const {
            firstName,
            lastName,
            phoneNumber,
            email,
            password,
            companyName,
        } = validation.data;

        const existingUser = await prisma.user.findFirst({
            where: { OR: [{ email }, { phoneNumber }] },
            select: { email: true, phoneNumber: true },
        });

        if (existingUser) {
            const message =
                existingUser.email === email
                    ? "An account with this email already exists"
                    : "An account with this phone number already exists";

            return NextResponse.json({ message }, { status: 409 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.$transaction(async (tx) => {
            // Every sign-up creates a brand new organization — there's no
            // invite/join-existing-org flow (and no Invite model) in the schema.
            const org = await tx.organization.create({
                data: {
                    id: randomUUID(),
                    name: companyName,
                    slug: slugify(companyName),
                },
            });

            // Whoever creates the org is always its first admin — role is
            // never taken from client input here (see validations/auth.ts).
            return tx.user.create({
                data: {
                    id: randomUUID(),
                    firstName,
                    lastName,
                    phoneNumber,
                    email,
                    password: hashedPassword,
                    role: "ADMIN",
                    organizationId: org.id,
                },
            });
        });

        // Auto-login: the password was already verified once above, so
        // forcing a second sign-in on success is pure friction.
        const session = await createSession(user.id);
        const token = signInSessionToken(session.id);

        const cookieStore = await cookies();
        cookieStore.set({
            name: SESSION_COOKIE_NAME,
            value: token,
            httpOnly: true,
            secure: env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24 * 30,
        });

        return NextResponse.json(
            { message: "Account successfully created", userId: user.id },
            { status: 201 }
        );
    } catch (error) {
        // Prisma unique constraint race condition (two signups at once)
        if (
            typeof error === "object" &&
            error !== null &&
            "code" in error &&
            (error as { code?: string }).code === "P2002"
        ) {
            return NextResponse.json(
                { message: "An account with these details already exists" },
                { status: 409 }
            );
        }

        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}