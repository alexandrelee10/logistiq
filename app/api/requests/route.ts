import { getCurrentUser } from "@/app/lib/auth";
import { orchestrate } from "@/app/lib/orchestrate";
import { NextResponse } from "next/server";

// Side-effect import: loads every feature module so their register() calls
// run and populate the action registry. Add new feature files to
// app/modules/index.ts, not here.
import "@/app/modules";

export async function POST(req: Request) {
    const user = await getCurrentUser();

    if (!user) {
        return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    }

    const data = await req.json();

    try {
        const result = await orchestrate(data, {
            userId: user.id,
            organizationId: user.organizationId,
        });

        return NextResponse.json(result.body ?? result, { status: result.status ?? 200 });
    } catch (error) {
        // Prisma unique constraint violation (e.g. a duplicate warehouse `code`
        // for this organization) — surface it as a real 409 instead of a bare 500.
        if (
            typeof error === "object" &&
            error !== null &&
            "code" in error &&
            (error as { code?: string }).code === "P2002"
        ) {
            return NextResponse.json(
                { error: "A record with these details already exists." },
                { status: 409 }
            );
        }

        // Anything else (including a handler that forgot to `return` and left
        // `result` undefined) lands here instead of crashing with no message.
        // Check this server log for the real cause.
        console.error(`Error handling action "${data?.action}":`, error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// Receives the request, verifies is signed in, and redirects the request via the handler 