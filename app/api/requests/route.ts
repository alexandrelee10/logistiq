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

    const result = await orchestrate(data, {
        userId: user.id,
        organizationId: user.organizationId,
    });

    return NextResponse.json(result.body ?? result, { status: result.status ?? 200 });
}

// Receives the request, verifies is signed in, and redirects the request via the handler 