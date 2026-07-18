// Maps action name to the function that handles it. Added two small helpers to add to it and read it if need be

type Handler = (data: Record<string, any>, ctx: RequestContext) => Promise<any>

export interface RequestContext {
    userId: string,
    organizationId: string
}

const REGISTRY = new Map<string, Handler>();

// Call once per action at module load time
export function register(name: string, handler: Handler) {
    if (REGISTRY.has(name)) {
        throw new Error(`Duplicate handler registered for action "${name}"`);
    }
    REGISTRY.set(name, handler);
}

export function getHandler(name: string): Handler | undefined {
    return REGISTRY.get(name);
}

// Think of this like a menu (I may forget so i am adding this to remind me)