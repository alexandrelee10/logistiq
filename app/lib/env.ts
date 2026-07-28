/**
 * Validates every environment variable this app depends on, once, the first
 * time this module is imported — so a missing or malformed value fails loudly
 * at startup instead of wherever it happens to first get read at runtime.
 *
 * Everywhere else in the app should import `env` from this file instead of
 * reading `process.env` directly.
 */

import z from "zod";

const envSchema = z.object({
    DATABASE_URL: z
    .string({ message: "DATABASE_URL is not set - check your .env file" })
    .url({ message: "DATABASE_URL must be a valid connection string" }),

    SESSION_SECRET: z
    .string({ message: "SESSION_SECRET is not set — check your .env file" })
    .min(32, "SESSION_SECRET must be at least 32 characters (it signs session JWTs — a short secret is brute-forceable)"),

    NODE_ENV: z.enum(["development", "production", "test" ]).default("development"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    console.error("Invalid enviornment variables");
    console.error(parsed.error.flatten().fieldErrors);
    throw new Error("Invalid enviornment variables - see errors above. Check your env.ts")
}

export const env = parsed.data;