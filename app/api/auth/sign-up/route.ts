import { prisma } from "@/app/lib/prisma";
import { signupSchema } from "@/validations/auth";
import { slugify } from "@/app/lib/slug";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

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
            role,
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

            return tx.user.create({
                data: {
                    id: randomUUID(),
                    firstName,
                    lastName,
                    phoneNumber,
                    email,
                    password: hashedPassword,
                    role,
                    organizationId: org.id,
                },
            });
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