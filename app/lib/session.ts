import { prisma } from "./prisma"

const SESSION_LIFETIME_MS = 1000 * 60 * 60 * 24 // 24 hours

// Create a new session for a user
export async function createSession(userId: string) {
    return prisma.session.create({
        data: {
            userId, expiresAt: new Date(Date.now() + SESSION_LIFETIME_MS) 
        },
    });
}

// Retrieve a session and verify that it hasn't expired
export async function getValidSession(sessionId: string) {
    const session = await prisma.session.findUnique({ where: {id: sessionId } });
    
    if (!session) {
        return null;
    };

    if (session.expiresAt < new Date()) {
        await prisma.session.delete({ where: { id: sessionId} });
        return null;
    };

    return session;
}

// Delete a specific session by its session ID
export async function deleteSession(sessionId: string) {
    await prisma.session.delete({ where: { id: sessionId } }); 
}

// Delete all sessions belonging to a specific user
export async function deleteAllSessions(userId: string) {
    await prisma.session.deleteMany({ where: { userId } });
}


// Changes:
// 1. Took userId: userId and made it userId in createSession
