/**
 * This file manages user authentication sessions by creating, verifying, and deleting session tokens. It uses JWTs to securely store a session ID in the user's browser while keeping the actual session information in the database with Prisma. 
 * On every request, it verifies the token, checks that the session still exists and hasn't expired, and only considers the user authenticated if those checks pass.
 */

import jwt from "jsonwebtoken"
import { prisma } from "./prisma";

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

export async function getValidSession(sessionId: string) {
    const session = await prisma.session.findUnique(
        { where: { id: sessionId} } // retrieves id and gets the sessionId of the user
    );
    
    if (!session) { return null; };

    if (session.expiresAt < new Date()) {
        await prisma.session.delete( {where : {id: sessionId }}).catch(() => {});
        return null;
    }
    return session;
}
export async function deleteSession(sessionId: string) {
    await prisma.session.delete({ where: { id: sessionId } }).catch(() => {});
}

export async function deleteAllSessionsForUser(userId: string) {
    await prisma.session.deleteMany( { where: { userId }});
}



