import { prisma } from "@/app/lib/prisma";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { token, firstName, lastName, email, phoneNumber, password } = await req.json();
        
        if(!token || !firstName || !lastName || !email || !phoneNumber || !password) {
            return NextResponse.json(
                { message: "All fields are required" },
                { status: 400 }
            );
        }

        const invite = await prisma.invite.findUnique({
            where: { token }
        });

        if (!invite || invite.status !== "pending") {
            return NextResponse.json(
                { message: "This invite is invalid or has already been used." },
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
                    organizationId: invite.organizationId
                },
            });

            await tx.invite.update({
                where: { id: invite.id },
                data: { status: "accepted" }
            });

            return newUser;
        });

        return NextResponse.json({ message: "Account successfully created " }, { status: 201 } );
    } catch (error) {
        if (typeof error === "object" && error !== null && "code" in error && (error as { code: string}).code === "P2002") {
            return NextResponse.json({ message: "An account withthese details already exists. " }, { status: 400 } );
        }
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}