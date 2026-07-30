"use client"

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, Mail, Lock, User, Phone, Building2, ArrowRight } from "lucide-react";
import AuthLayout from "./AuthLayout";

type SignUpFormData = {
    firstName: string,
    lastName: string,
    phoneNumber: string,
    email: string,
    password: string,
    confirmPassword: string,
    companyName: string
}

type FieldErrors = Partial<Record<keyof SignUpFormData, string>>;

// Extracts an invite token whether the user pastes the full acceptUrl
// (e.g. https://app.logistiq.com/accept-invite?token=abc123) or just the
// raw token/code itself.
function extractInviteToken(input: string): string {
    const trimmed = input.trim();
    const match = trimmed.match(/[?&]token=([^&\s]+)/);
    if (match) return decodeURIComponent(match[1]);
    return trimmed;
}

export default function SignUp() {
    const router = useRouter();
    const [mode, setMode] = useState<"create" | "join">("create");

    const [form, setForm] = useState<SignUpFormData>({
        firstName: "",
        lastName: "",
        phoneNumber: "",
        email: "",
        password: "",
        confirmPassword: "",
        companyName: "" // DEFAULT
    });

    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
    const [serverMessage, setServerMessage] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const [inviteInput, setInviteInput] = useState("");
    const [inviteError, setInviteError] = useState("");

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    };

    const handleJoinSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setInviteError("");

        const token = extractInviteToken(inviteInput);
        if (!token) {
            setInviteError("Paste the invite link or code your admin sent you");
            return;
        }

        router.push(`/accept-invite?token=${encodeURIComponent(token)}`);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setServerMessage("");
        setFieldErrors({});
        setSubmitting(true);

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
                setServerMessage(data.message ?? "Unable to create account");

                const fieldErrorEntries = data?.error?.fieldErrors as
                    | Record<string, string[]>
                    | undefined;

                if (fieldErrorEntries) {
                    const next: FieldErrors = {};
                    for (const [key, messages] of Object.entries(fieldErrorEntries)) {
                        if (messages?.[0]) next[key as keyof SignUpFormData] = messages[0];
                    }
                    setFieldErrors(next);
                }

                return;
            }

            // Sign-up now signs you in server-side — no need to re-enter
            // credentials on a separate sign-in screen.
            router.push("/dashboard");
        } catch {
            setServerMessage("Something went wrong. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AuthLayout
            title={mode === "create" ? "Create your account" : "Join your team"}
            subtitle={
                mode === "create"
                    ? "Set up access for your team in minutes."
                    : "Enter the invite your admin sent you to join their organization."
            }
            footer={
                <p className="text-sm text-foreground/60">
                    Already have an account?{" "}
                    <Link href="/sign-in" className="font-semibold text-accent no-underline">
                        Sign in
                    </Link>
                </p>
            }
        >
            <div className="mb-6 grid grid-cols-2 gap-1 rounded-full bg-slate-100 p-1">
                <button
                    type="button"
                    onClick={() => setMode("create")}
                    className={`rounded-full py-2 text-sm font-bold transition-colors ${
                        mode === "create" ? "bg-white text-foreground shadow-sm" : "text-foreground/50"
                    }`}
                >
                    Create organization
                </button>
                <button
                    type="button"
                    onClick={() => setMode("join")}
                    className={`rounded-full py-2 text-sm font-bold transition-colors ${
                        mode === "join" ? "bg-white text-foreground shadow-sm" : "text-foreground/50"
                    }`}
                >
                    Join organization
                </button>
            </div>

            {mode === "join" ? (
                <form onSubmit={handleJoinSubmit} className="flex flex-col gap-4" noValidate>
                    <Field label="Invitation link or code" error={inviteError || undefined}>
                        <input
                            name="invite"
                            value={inviteInput}
                            placeholder="Paste your invite link or code"
                            onChange={(e) => {
                                setInviteInput(e.target.value);
                                setInviteError("");
                            }}
                            required
                            className="w-full border border-black/15 px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-accent"
                        />
                    </Field>

                    <button
                        type="submit"
                        className="mt-2 flex items-center justify-center gap-2 text-sm font-bold text-white bg-accent hover:bg-accent-hover transition-colors px-5 py-2.5"
                    >
                        Continue <ArrowRight size={16} />
                    </button>
                </form>
            ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
                <div className="grid grid-cols-2 gap-4">
                    <Field label="First name" error={fieldErrors.firstName}>
                        <div className="relative">
                            <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/35" />
                            <input
                                name="firstName"
                                value={form.firstName}
                                placeholder="John"
                                onChange={handleChange}
                                autoComplete="given-name"
                                required
                                className="w-full border border-black/15 pl-9 pr-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-accent"
                            />
                        </div>
                    </Field>

                    <Field label="Last name" error={fieldErrors.lastName}>
                        <input
                            name="lastName"
                            value={form.lastName}
                            placeholder="Doe"
                            onChange={handleChange}
                            autoComplete="family-name"
                            required
                            className="w-full border border-black/15 px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-accent"
                        />
                    </Field>
                </div>

                <Field label="Company name" error={fieldErrors.companyName}>
                    <div className="relative">
                        <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/35" />
                        <input
                            name="companyName"
                            value={form.companyName}
                            placeholder="Acme Inc."
                            onChange={handleChange}
                            autoComplete="organization"
                            required
                            className="w-full border border-black/15 pl-9 pr-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-accent"
                        />
                    </div>
                </Field>

                <Field label="Email" error={fieldErrors.email}>
                    <div className="relative">
                        <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/35" />
                        <input
                            type="email"
                            name="email"
                            placeholder="johndoe@example.com"
                            value={form.email}
                            onChange={handleChange}
                            autoComplete="email"
                            required
                            className="w-full border border-black/15 pl-9 pr-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-accent"
                        />
                    </div>
                </Field>

                <Field label="Phone number" error={fieldErrors.phoneNumber}>
                    <div className="relative">
                        <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/35" />
                        <input
                            type="tel"
                            name="phoneNumber"
                            value={form.phoneNumber}
                            onChange={handleChange}
                            autoComplete="tel"
                            placeholder="+1 (555) 000-0000"
                            required
                            className="w-full border border-black/15 pl-9 pr-3 py-2.5 text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-accent"
                        />
                    </div>
                </Field>

                <Field label="Password" error={fieldErrors.password}>
                    <div className="relative">
                        <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/35" />
                        <input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            value={form.password}
                            placeholder="• • • • • • • "
                            onChange={handleChange}
                            autoComplete="new-password"
                            required
                            className="w-full border border-black/15 pl-9 pr-9 py-2.5 text-sm text-foreground focus:outline-none focus:border-accent"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword((v) => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/35 hover:text-foreground/60"
                            aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                    <p className="text-xs text-foreground/40">At least 8 characters</p>
                </Field>

                <Field label="Confirm password" error={fieldErrors.confirmPassword}>
                    <div className="relative">
                        <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/35" />
                        <input
                            type={showPassword ? "text" : "password"}
                            name="confirmPassword"
                            value={form.confirmPassword}
                            placeholder="• • • • • • • "
                            onChange={handleChange}
                            autoComplete="new-password"
                            required
                            className="w-full border border-black/15 pl-9 pr-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-accent"
                        />
                    </div>
                </Field>

                <p className="text-xs text-foreground/40 -mt-2">
                    You&apos;ll be the admin of {form.companyName || "your new organization"}.
                </p>

                {serverMessage && (
                    <p className="text-sm font-semibold text-accent">{serverMessage}</p>
                )}

                <button
                    type="submit"
                    disabled={submitting}
                    className="mt-2 flex items-center justify-center gap-2 text-sm font-bold text-white bg-accent hover:bg-accent-hover transition-colors px-5 py-2.5 disabled:opacity-60"
                >
                    {submitting && <Loader2 size={16} className="animate-spin" />}
                    {submitting ? "Creating account..." : "Create account"}
                </button>
            </form>
            )}
        </AuthLayout>
    )
}

function Field({
    label,
    error,
    children,
}: {
    label: string;
    error?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-foreground">{label}</label>
            {children}
            {error && <p className="text-xs font-medium text-accent">{error}</p>}
        </div>
    );
}
