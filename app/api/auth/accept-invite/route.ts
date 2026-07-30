import { prisma } from "@/app/lib/prisma";
import { SESSION_COOKIE_NAME } from "@/app/lib/auth";
import { createSession } from "@/app/lib/session";
import { signInSessionToken } from "@/app/lib/jwt";
import { acceptInviteSchema } from "@/validations/auth";
import { env } from "@/app/lib/env";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// Lets the join-organization UI preview an invite (org name + assigned role)
// before the invitee types a password. Only ever exposes non-sensitive
// fields — never the token itself back, never other org data.
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
        return NextResponse.json({ message: "Missing invite token" }, { status: 400 });
    }

    const invite = await prisma.invite.findUnique({
        where: { token },
        include: { organization: { select: { name: true } } },
    });

    if (!invite || invite.status !== "pending") {
        return NextResponse.json(
            { message: "This invite is invalid or has already been used." },
            { status: 400 }
        );
    }

    if (invite.expiresAt < new Date()) {
        return NextResponse.json(
            { message: "This invite has expired. Ask an admin to send a new one." },
            { status: 400 }
        );
    }

    return NextResponse.json(
        {
            organizationName: invite.organization.name,
            email: invite.email,
            role: invite.role,
        },
        { status: 200 }
    );
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const validation = acceptInviteSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { message: "Fill in required fields", error: validation.error.flatten() },
                { status: 400 }
            );
        }

        const { token, firstName, lastName, phoneNumber, password } = validation.data;

        const invite = await prisma.invite.findUnique({ where: { token } });

        if (!invite || invite.status !== "pending") {
            return NextResponse.json(
                { message: "This invite is invalid or has already been used." },
                { status: 400 }
            );
        }

        // The 7-day TTL that createInvite sets was never actually enforced
        // here before — status alone doesn't catch a stale-but-pending link.
        if (invite.expiresAt < new Date()) {
            return NextResponse.json(
                { message: "This invite has expired. Ask an admin to send a new one." },
                { status: 400 }
            );
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.$transaction(async (tx) => {
            const newUser = await tx.user.create({
                data: {
                    id: randomUUID(),
                    firstName,
                    lastName,
                    phoneNumber,
                    email: invite.email,
                    password: hashedPassword,
                    role: invite.role,
                    organizationId: invite.organizationId,
                },
            });

            await tx.invite.update({
                where: { id: invite.id },
                data: { status: "accepted" },
            });

            return newUser;
        });

        // Auto-login, same as sign-up — the password was already verified once.
        const session = await createSession(user.id);
        const sessionToken = signInSessionToken(session.id);

        const cookieStore = await cookies();
        cookieStore.set({
            name: SESSION_COOKIE_NAME,
            value: sessionToken,
            httpOnly: true,
            secure: env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24 * 30,
        });

        return NextResponse.json({ message: "Account successfully created" }, { status: 201 });
    } catch (error) {
        if (
            typeof error === "object" &&
            error !== null &&
            "code" in error &&
            (error as { code?: string }).code === "P2002"
        ) {
            return NextResponse.json(
                { message: "An account with these details already exists." },
                { status: 409 }
            );
        }
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
