"use client"

import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2, Mail, Lock, CheckCircle2 } from "lucide-react";
import AuthLayout from "./AuthLayout";

type SignInFormData = {
    email: string,
    password: string,
}

export default function SignIn() {
    const router = useRouter();
    
    // read url and checks if account was just created 
    const searchParams = useSearchParams();
    const justCreated = searchParams.get("created") === "1";

    const [form, setForm] = useState<SignInFormData>({
        email: "",
        password: "",
    });

    const [submitting, setSubmitting] = useState(false);
    const [serverMessage, setServerMessage] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setServerMessage("");
        setSubmitting(true);

        try {
            const res = await fetch("/api/auth/sign-in", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(form)
            });

            const data = await res.json();

            if (!res.ok) {
                setServerMessage(data.message ?? "Unable to sign in");
                return;
            }

            router.push("/dashboard");
        } catch {
            setServerMessage("Something went wrong. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AuthLayout
            title="Welcome back"
            subtitle="Sign in to your Logistiq account."
            footer={
                <p className="text-sm text-foreground/60">
                    Don&apos;t have an account?{" "}
                    <Link href="/sign-up" className="font-semibold text-accent no-underline">
                        Sign up
                    </Link>
                </p>
            }
        >
            {/* Custom function for when user signs up and is redirected */}
            {justCreated && (
                <div className="mb-6 flex items-center gap-2 rounded-xl border border-emerald-600/20 bg-emerald-50 text-emerald-700 text-sm font-medium px-4 py-2.5">
                    <CheckCircle2 size={16} className="shrink-0" />
                    Account created. Sign in to continue.
                </div>
            )}

            {/* SSO --- work in progress */}
            <div className="flex flex-col gap-3">
                <button
                    type="button"
                    disabled
                    title="SSO sign-in is coming soon"
                    className="flex items-center justify-center gap-2 rounded-full border border-slate-200 text-sm font-semibold text-foreground/40 px-5 py-2.5 cursor-not-allowed opacity-60"
                >
                    <GoogleMark />
                    Continue with Google
                </button>
                <button
                    type="button"
                    disabled
                    title="SSO sign-in is coming soon"
                    className="flex items-center justify-center gap-2 rounded-full border border-slate-200 text-sm font-semibold text-foreground/40 px-5 py-2.5 cursor-not-allowed opacity-60"
                >
                    <MicrosoftMark />
                    Continue with Microsoft
                </button>
            </div>


            <div className="flex items-center gap-3 my-6">
                <div className="h-px flex-1 bg-slate-100" />
                <span className="text-xs font-semibold text-foreground/40 uppercase">or</span>
                <div className="h-px flex-1 bg-slate-100" />
            </div>

            {/* Sign in form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                    <label htmlFor="email" className="text-sm font-semibold text-foreground">
                        Email
                    </label>
                    <div className="relative">
                        <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/35" />
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            value={form.email}
                            onChange={handleChange}
                            className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                        <label htmlFor="password" className="text-sm font-semibold text-foreground">
                            Password
                        </label>
                        <span className="text-xs font-semibold text-foreground/30">Forgot password?</span>
                    </div>
                    <div className="relative">
                        <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/35" />
                        <input
                            id="password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            autoComplete="current-password"
                            required
                            value={form.password}
                            onChange={handleChange}
                            className="w-full rounded-xl border border-slate-200 pl-9 pr-9 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
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
                </div>

                {serverMessage && (
                    <p className="text-sm font-semibold text-accent">{serverMessage}</p>
                )}

                <button
                    type="submit"
                    disabled={submitting}
                    className="mt-2 flex items-center justify-center gap-2 text-sm font-bold text-white bg-accent hover:bg-accent-hover transition-colors px-5 py-2.5 rounded-full shadow-sm shadow-accent/25 disabled:opacity-60"
                >
                    {submitting && <Loader2 size={16} className="animate-spin" />}
                    {submitting ? "Signing in..." : "Sign In"}
                </button>
            </form>
        </AuthLayout>
    )
}
// Custom svg for sso 
function GoogleMark() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.63h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.81z" />
            <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.95-2.92l-3.88-3c-1.08.72-2.46 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.26v3.11A11.99 11.99 0 0 0 12 24z" />
            <path fill="#FBBC05" d="M5.27 14.27a7.2 7.2 0 0 1 0-4.54v-3.1H1.26a12 12 0 0 0 0 10.75z" />
            <path fill="#EA4335" d="M12 4.75c1.76 0 3.34.61 4.59 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0A11.99 11.99 0 0 0 1.26 6.63l4.01 3.1C6.22 6.87 8.87 4.75 12 4.75z" />
        </svg>
    );
}

function MicrosoftMark() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
            <rect x="1" y="1" width="10" height="10" fill="#F25022" />
            <rect x="13" y="1" width="10" height="10" fill="#7FBA00" />
            <rect x="1" y="13" width="10" height="10" fill="#00A4EF" />
            <rect x="13" y="13" width="10" height="10" fill="#FFB900" />
        </svg>
    );
}
