import { prisma } from "@/app/lib/prisma";
import { register } from "@/app/lib/registry";
import { randomUUID } from "crypto";

const INVITE_TTL_DAYS = 7;

// Create Invite 
register("createInvite", async (data , ctx) => {
    const { email, role } = data;

    if (!email || !role) {
        return {
            status: 400,
            body: { error: "email and role are required" },
       };
    }

    const existingUser = await prisma.user.findFirst({
        where: { email, organizationId: ctx.organizationId },
    });
    
    // Enusre user exist and is available for an invite
    if (existingUser) {
        const message =
            existingUser.organizationId === ctx.organizationId
                ? "This person is already a member of your organization."
                : "This email is already registered to a different organization.";
        return { status: 409, body: { error: message } };
}

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + INVITE_TTL_DAYS);

    const invite = await prisma.invite.upsert({
        where: { organizationId_email: { organizationId: ctx.organizationId, email } },
        update: { role, token: randomUUID(), status: "pending", invitedByUserId: ctx.userId, expiresAt },
        create: {
            organizationId: ctx.organizationId,
            email,
            role,
            token: randomUUID(),
            invitedByUserId: ctx.userId,
            status: "pending",
            expiresAt
        }
    });

    // No email service wired up yet — return the link so you can copy/paste
    // it to the person you're inviting until a later step adds real delivery.
    return { status: 201, body: { invite, acceptUrl: `/accept-invite?token=${invite.token}` } };
});

// List all invites 
register("listInvites", async (_data , ctx) => {
   const invites = await prisma.invite.findMany({
    where: { organizationId: ctx.organizationId, status: "pending" },
    orderBy: { createdAt: "desc" },
   });
   
   return { status: 200, body: { invites } };
})

register("revokeInvite", async(data , ctx) => {
    const { inviteId } = data;

    const invite = await prisma.invite.findUnique({
        where: { id: inviteId, organizationId: ctx.organizationId }, 
    });

    if (!invite) {
        return {
            status: 400,
            body: { error: "Invite not found" },
        };
    }

    if (invite.status === "accepted") {
        return {
            status: 400,
            body: { error: "Cannot revoke an invite that has already been accepted" }
        };
    }

    if (invite.status === "revoked") {
        return {
            status: 400,
            body: { error: "Cannot revoke an invite that has already been revoked" }, 
        };
    }

    const updated = await prisma.invite.update({
        where: { id: inviteId, organizationId: ctx.organizationId },
        data: { status: "revoked" },
    });

    return { status: 200, body: { invite: updated } };
})