import { getCurrentUser } from "@/app/lib/auth";
import { orchestrate } from "@/app/lib/orchestrate";
import { NextResponse } from "next/server";

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