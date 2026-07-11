"use client"

import Image from "next/image";
import { NextResponse } from "next/server";
import { useState } from "react";
import logistiqLogo from "@/public/assets/logo/new-logo-dark.png"

type SignUpFormData = {
    firstName: string,
    lastName: string,
    phoneNumber: string,
    email: string,
    password: string,
    role: "DRIVER" | "BROKER" | "DRIVERLEADER" | "MAINTENANCE" | "DISPATCH" | "FLEET" | "COMPLIANCE" | "ACCOUNTING"
}
export default function SignUp() {

    const [form, setForm] = useState<SignUpFormData>({
        firstName: "",
        lastName: "",
        phoneNumber: "",
        email: "",
        password: "",
        role: "DRIVER" // DEFAULT
    });

    const [fieldErrors, setFieldErrors] = useState({});
    const [serverMessage, setServerMessage] = useState("");

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setServerMessage("");

        try {
            const res = await fetch("/api/auth/sign-up", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(form)
            });

            const data = await res.json();

            if (!res.ok) {
                setServerMessage(data.message);
                return;
            }

            setServerMessage("Account created")
        } catch {
            setServerMessage("Something went wrong. Please try again.")
        }

    }

    return (
        <main className="">
            <div className="flex">
                {/* Left */}
                <div className="flex-1 bg-red-700 min-h-screen">
                    <Image 
                    src={logistiqLogo}
                    alt="Logo"
                    height={400}
                    width={400}
                    className="justify-center items-center"
                    />
                </div>
                {/* Right */}
                <div className="flex-1">

                </div>
            </div>
        </main>
    )
}