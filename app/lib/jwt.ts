/**
 * This file manages user authentication sessions by creating, verifying, and deleting session tokens. It uses JWTs to securely store a session ID in the user's browser while keeping the actual session information in the database with Prisma. 
 * On every request, it verifies the token, checks that the session still exists and hasn't expired, and only considers the user authenticated if those checks pass.
 */

import jwt from "jsonwebtoken"

const SESSION_SECRET: string = process.env.SESSION_SECRET ?? (() => {
    throw new Error("SESSION_SECRET is not set — check your .env file");
})();

export function signInSessionToken(sessionId: string) {
    return jwt.sign({ sid: sessionId }, SESSION_SECRET, { expiresIn: "30d"})
}

export function verifySessionToken(token: string): { sid: string } | null {
    try {
        const decoded = jwt.verify(token, SESSION_SECRET) as { sid: string };
        return decoded;
    } catch {
        return null;
    }
}

// Session CRUD (create/read/delete) lives in ./session — kept here previously as a
// duplicate, which risked the two copies drifting out of sync.

