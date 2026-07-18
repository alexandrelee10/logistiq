import { getHandler } from "./registry";
import type {  RequestContext } from "./registry";

export async function orchestrate(data: Record<string, any>, ctx: RequestContext) {
    const action = data.action;
    const handler = getHandler(action);

    if (!handler) {
        return { status: 400, body: { error: `Unknown action: ${action} `} };
    }

    return handler(data, ctx);
}

// This is what reads the action and directs it using our map 