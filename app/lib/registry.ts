// Maps action name to the function that handles it. Added two small helpers to add to it and read it if need be

import { USERROLE } from "@/generated/prisma/enums";
import { env } from "./env";

type Handler = (data: Record<string, any>, ctx: RequestContext) => Promise<any>

export interface RequestContext {
    userId: string,
    organizationId: string,
    role: USERROLE
}

const REGISTRY = new Map<string, Handler>();


export function register(name: string, handler: Handler) {
    if (REGISTRY.has(name) && env.NODE_ENV === "production") {
        throw new Error(`Duplicate handler registered for action "${name}"`);
    }
    REGISTRY.set(name, handler);
}

export function getHandler(name: string): Handler | undefined {
    return REGISTRY.get(name);
}

// Think of this like a menu (I may forget so i am adding this to remind me)