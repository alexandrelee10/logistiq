# `app/lib/jwt.ts`, for dummies

Your notes on what every line of this file actually does. Written against the file as it stands right now — 18 lines, two exported functions.

```ts
import jwt from "jsonwebtoken"
```

Pulls in the library that does the actual cryptographic work. `zod` (already elsewhere in this app) checks data *shapes*; `jsonwebtoken` signs and verifies *strings*. Nothing overlaps between them.

---

```ts
const SESSION_SECRET: string = process.env.SESSION_SECRET ?? (() => {
    throw new Error("SESSION_SECRET is not set — check your .env file");
})();
```

This one line is doing three things at once, which is why it looks dense:

1. **`process.env.SESSION_SECRET`** — reads the secret out of your `.env` file. TypeScript's built-in type for *any* env var is `string | undefined`, because it has no way to know at compile time whether you actually set it.
2. **`??`** — the "nullish coalescing" operator. Plain-language version: "use the thing on the left, unless it's `null`/`undefined`, in which case run the thing on the right instead."
3. **`(() => { throw ... })()`** — an anonymous function that's defined and immediately called (that trailing `()` calls it right away). Its only job is to throw an error. Wrapping a `throw` in a function like this is a trick to let it live inside an expression (`??` needs something that *evaluates to a value* on both sides — a bare `throw` on its own isn't a value, but "a function that throws, called immediately" is).

Put together: *"Read the secret. If it's missing, immediately crash the server with a clear message instead of limping along with `undefined."`* The `: string` annotation on the left locks in that from this point on, in every function below, `SESSION_SECRET` is treated as a guaranteed real string — never `undefined` — even though the raw env read technically could have been.

---

```ts
export function signInSessionToken(sessionId: string) {
    return jwt.sign({ sid: sessionId }, SESSION_SECRET, { expiresIn: "30d"})
}
```

Takes a session ID (a plain string, generated elsewhere when a `Session` row gets created in the database) and turns it into a signed token — the thing that actually goes in the cookie.

- `{ sid: sessionId }` — the **payload**. `sid` is just a property name I chose, short for "session id." Not a reserved word, not magic — could be named anything. This is the only piece of information the token carries, on purpose: just enough to look up the real session row, nothing sensitive.
- `SESSION_SECRET` — the key used to compute the signature. Nobody can produce a token that verifies successfully without this exact value.
- `{ expiresIn: "30d" }` — bakes an expiry into the token itself, so even a copied/stolen token stops working after 30 days regardless of anything else.

`jwt.sign()` hands back one string with three dot-separated parts (header, payload, signature) — that whole string is what gets stored as the cookie's value.

---

```ts
export function verifySessionToken(token: string): { sid: string } | null {
    try {
        const decoded = jwt.verify(token, SESSION_SECRET) as { sid: string };
        return decoded;
    } catch {
        return null;
    }
}
```

The reverse direction: given a token string (read back out of the cookie on a later request), figure out whether it's legit, and if so, what session it points to.

The whole shape of this function exists because of one surprising fact: **`jwt.verify()` doesn't return `null` or `false` on failure — it throws.** So:

- `try` — attempt to verify. Internally, `jwt.verify` recomputes what the signature *should* be from the token's header + payload + `SESSION_SECRET`, and compares that to the signature actually attached to the token. Match → it returns the decoded payload (`{ sid: "..." }`). No match, or expired, or malformed → it throws.
- `as { sid: string }` — a type cast. `jwt.verify`'s real return type is a generic "could be all sorts of shapes" type, because the library has no idea what *you* chose to put in your payload. This tells TypeScript "trust me, I know it's `{ sid: string }`" (true, because `signInSessionToken` is the only thing that ever creates these).
- `catch` — catches *any* failure reason (bad signature, expired, garbage input — doesn't matter which) and turns it into one single, clean answer: `null`.

That `null`-instead-of-throwing contract is the whole point: whatever calls `verifySessionToken` later (namely `getCurrentUser` in `auth.ts`) gets to write a plain `if (!decoded) return null;` and never has to wrap this in its own `try/catch`.

---

## Quick recap

| Term | Plain meaning |
|---|---|
| `sid` | The property name for "session id" inside the token's payload — a name I picked, not a reserved keyword. |
| Payload | The (unencrypted, readable-by-anyone) data inside a JWT — here, just `{ sid }`. |
| Signature | A hash of the payload + your secret. Proves the payload wasn't edited after signing. |
| `??` | "Use the left side, unless it's null/undefined — then use the right side." |
| `(() => {...})()` | A function written and called in the same breath — used here so a `throw` can sit inside an expression. |
| Why `verifySessionToken` returns `null` instead of throwing | So every caller can use a plain `if` check instead of needing its own `try/catch`. |
