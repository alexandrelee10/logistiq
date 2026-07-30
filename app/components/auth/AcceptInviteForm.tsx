"use client"

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2, Lock, User, Phone, Building2, AlertTriangle } from "lucide-react";
import AuthLayout from "./AuthLayout";

type InvitePreview = {
    organizationName: string;
    email: string;
    role: string;
};

type AcceptInviteFormData = {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    password: string;
    confirmPassword: string;
};

type FieldErrors = Partial<Record<keyof AcceptInviteFormData, string>>;

function roleLabel(role: string) {
    return role
        .toLowerCase()
        .split("_")
        .map((w) => w[0]?.toUpperCase() + w.slice(1))
        .join(" ");
}

export default function AcceptInviteForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token") ?? "";

    // Only kick off the fetch (and the loading state) when there's actually
    // a token to look up — avoids setting state synchronously in the effect
    // body for the no-token case.
    const [loadingInvite, setLoadingInvite] = useState(Boolean(token));
    const [invite, setInvite] = useState<InvitePreview | null>(null);
    const [loadError, setLoadError] = useState(
        token ? "" : "This invite link is missing its token."
    );

    const [form, setForm] = useState<AcceptInviteFormData>({
        firstName: "",
        lastName: "",
        phoneNumber: "",
        password: "",
        confirmPassword: "",
    });

    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
    const [serverMessage, setServerMessage] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (!token) return;

        let cancelled = false;

        (async () => {
            try {
                const res = await fetch(`/api/auth/accept-invite?token=${encodeURIComponent(token)}`);
                const data = await res.json();

                if (cancelled) return;

                if (!res.ok) {
                    setLoadError(data.message ?? "This invite is invalid or has already been used.");
                } else {
                    setInvite(data);
                }
            } catch {
                if (!cancelled) setLoadError("Something went wrong loading this invite.");
            } finally {
                if (!cancelled) setLoadingInvite(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [token]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setServerMessage("");
        setFieldErrors({});
        setSubmitting(true);

        try {
            const res = await fetch("/api/auth/accept-invite", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, ...form }),
            });

            const data = await res.json();

            if (!res.ok) {
                setServerMessage(data.message ?? "Unable to join organization");

                const fieldErrorEntries = data?.error?.fieldErrors as
                    | Record<string, string[]>
                    | undefined;

                if (fieldErrorEntries) {
                    const next: FieldErrors = {};
                    for (const [key, messages] of Object.entries(fieldErrorEntries)) {
                        if (messages?.[0]) next[key as keyof AcceptInviteFormData] = messages[0];
                    }
                    setFieldErrors(next);
                }

                return;
            }

            // Server already set the session cookie — go straight in.
            router.push("/dashboard");
        } catch {
            setServerMessage("Something went wrong. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loadingInvite) {
        return (
            <AuthLayout title="Join organization" subtitle="Checking your invite…" footer={null}>
                <div className="flex items-center justify-center py-8 text-foreground/40">
                    <Loader2 size={20} className="animate-spin" />
                </div>
            </AuthLayout>
        );
    }

    if (loadError || !invite) {
        return (
            <AuthLayout
                title="Invite not valid"
                subtitle="We couldn't find an active invite for this link."
                footer={
                    <p className="text-sm text-foreground/60">
                        Have your own account?{" "}
                        <Link href="/sign-up" className="font-semibold text-accent no-underline">
                            Sign up
                        </Link>
                    </p>
                }
            >
                <div className="flex items-start gap-2 rounded-xl border border-red-600/20 bg-red-50 text-red-700 text-sm font-medium px-4 py-3">
                    <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                    {loadError || "This invite is invalid or has already been used."}
                </div>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout
            title="Join organization"
            subtitle={`You've been invited to join ${invite.organizationName}.`}
            footer={
                <p className="text-sm text-foreground/60">
                    Already have an account?{" "}
                    <Link href="/sign-in" className="font-semibold text-accent no-underline">
                        Sign in
                    </Link>
                </p>
            }
        >
            <div className="mb-6 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/10 text-accent">
                    <Building2 size={16} />
                </span>
                <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">{invite.organizationName}</p>
                    <p className="text-xs text-foreground/50">
                        {invite.email} &middot; joining as{" "}
                        <span className="font-semibold text-foreground/70">{roleLabel(invite.role)}</span>
                    </p>
                </div>
            </div>

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
                                className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
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
                            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                        />
                    </Field>
                </div>

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
                            className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
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
                            className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                        />
                    </div>
                </Field>

                {serverMessage && (
                    <p className="text-sm font-semibold text-accent">{serverMessage}</p>
                )}

                <button
                    type="submit"
                    disabled={submitting}
                    className="mt-2 flex items-center justify-center gap-2 rounded-full text-sm font-bold text-white bg-accent hover:bg-accent-hover transition-colors px-5 py-2.5 shadow-sm shadow-accent/25 disabled:opacity-60"
                >
                    {submitting && <Loader2 size={16} className="animate-spin" />}
                    {submitting ? "Joining..." : "Join organization"}
                </button>
            </form>
        </AuthLayout>
    );
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
