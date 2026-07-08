"use client"

import { NextResponse } from "next/server";
import { useState } from "react";

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
}