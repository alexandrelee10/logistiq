import { prisma } from "@/app/lib/prisma";
import { signupSchema } from "@/validations/auth";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(req: Request) {

    try {
        const body = await req.json();
        const validation = await signupSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { message: "Fill in required fields", error: validation.error.flatten() },
                { status: 400 }
            );
        };

        const { firstName, lastName, phoneNumber, email, role, password } = validation.data;

        const existingUser = await prisma.user.findUnique({
            where: { email },
            select: { id: true } // Ensures whole table is not being pulled
        });

        // Find if user already exist
        if (existingUser) {
            return NextResponse.json(
                { message: "User already exist" },
                { status: 409 }
            )
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.user.create({
            data: {
                firstName: firstName,
                lastName: lastName,
                phoneNumber: phoneNumber,
                email: email,
                password: hashedPassword,
                role: role
            },
        });


        return NextResponse.json(
            { message: "Account successfully created" },
            { status: 201 }
        )
    } catch (error) {
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}