# Step 1 — Real Sessions (JWT + Database Session)

Companion to `CharterRoute_Pattern_Conceptual_Guide.pdf`, section 3 ("Two Ways to Prove You're Logged In, at the Same Time"), applied to the actual Logistiq codebase. This doc tells you what to build and why, in order. You're writing the code — nothing here gets applied automatically.

## Why this is Step 1, before anything else

Open `app/api/auth/sign-in/route.ts`. Right now it does this:

```ts
cookieStore.set({
  name: SESSION_COOKIE_NAME,
  value: user.id,   // <-- just the raw user id, as plain text
  ...
});
```

And `app/dashboard/layout.tsx` / `app/dashboard/page.tsx` both do this:

```ts
const sessionUserId = cookieStore.get(SESSION_COOKIE_NAME)?.value;
const user = await prisma.user.findUnique({ where: { id: sessionUserId } });
```

There's no signature, no check that this value was ever legitimately issued by your server. It's `httpOnly` so a browser script can't read it, but nothing stops a direct HTTP request from setting `Cookie: logistiq_session=<any-user-id-you-know>` and being treated as that user — no password required. That's exactly the gap section 3 of the concept guide is describing: a "wristband" (something fast to check) with no "guest list" (a real record only your server controls) backing it up.

The fix is the pattern from the guide: the cookie holds a **signed token** (the JWT / wristband) that only proves "this maps to session ID X" — it proves nothing else by itself. Whether session X is actually still valid is decided by looking it up in a **database table** (the guest list). Both have to agree. Signing out deletes the database row, which instantly invalidates the token even though the token itself would still "look" valid until it expires.

## The new folder structure

Nothing moves. You're adding two new files next to the ones that already exist in `app/lib/`, and editing four existing files.

```
logistiq/
├─ prisma/
│  └─ schema.prisma              # ADD: Session model + relation on User
├─ .env                          # ADD: SESSION_SECRET
├─ app/
│  ├─ lib/
│  │  ├─ prisma.ts               # unchanged
│  │  ├─ auth.ts                 # REWRITE: real getCurrentUser()
│  │  ├─ jwt.ts                  # NEW: sign/verify the cookie's token
│  │  └─ session.ts              # NEW: create/validate/delete Session rows
│  ├─ api/auth/
│  │  ├─ sign-in/route.ts        # EDIT: create a Session row, sign a token
│  │  ├─ sign-up/route.ts        # unchanged
│  │  └─ sign-out/route.ts       # EDIT: delete the Session row, not just the cookie
│  └─ dashboard/
│     ├─ layout.tsx              # EDIT: call getCurrentUser() instead of reading the cookie directly
│     └─ page.tsx                # EDIT: same
```

`jwt.ts` and `session.ts` are split on purpose, mirroring the guide's own distinction: `jwt.ts` only knows how to sign/verify a string — it never touches the database. `session.ts` only knows how to talk to the `Session` table — it never touches cookies or tokens. `auth.ts` is the one place that combines both, so every page/route that needs "who is this?" goes through that single function instead of re-deriving the logic (the same "one front door" idea from section 1/6 of the guide, just applied to this one specific check).

## Do it in this order

### 1. Generate a secret and add it to `.env`

This secret is what makes the signature unforgeable — anyone who has it can mint valid tokens, so it must never be committed or logged.

```
openssl rand -base64 32
```

Add the output to `.env`:

```
SESSION_SECRET=<paste the generated value>
```

### 2. Install a JWT library

```
npm install jsonwebtoken
npm install -D @types/jsonwebtoken
```

### 3. Add the `Session` model to `prisma/schema.prisma`

```prisma
model Session {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime
  createdAt DateTime @default(now())
}
```

And add the back-relation on the existing `User` model:

```prisma
model User {
  // ...existing fields...
  sessions Session[]
}
```

Then run:

```
npx prisma migrate dev --name add_sessions
```

(`migrate dev` writes a real migration file under `prisma/migrations/` and regenerates the client — this is the "careful, reviewed changes" habit from section 9 of the guide, worth starting now rather than after real data exists.)

### 4. Write `app/lib/jwt.ts`

Its only job: turn a session ID into a signed string, and turn a signed string back into a session ID (or `null` if it's been tampered with or expired).

```ts
import jwt from "jsonwebtoken";

const SESSION_SECRET = process.env.SESSION_SECRET!;

export function signSessionToken(sessionId: string): string {
  return jwt.sign({ sid: sessionId }, SESSION_SECRET, { expiresIn: "30d" });
}

export function verifySessionToken(token: string): { sid: string } | null {
  try {
    return jwt.verify(token, SESSION_SECRET) as { sid: string };
  } catch {
    return null; // bad signature, tampered, or expired
  }
}
```

### 5. Write `app/lib/session.ts`

Its only job: create, validate, and delete rows in the `Session` table.

```ts
import { prisma } from "@/app/lib/prisma";

const SESSION_LIFETIME_MS = 1000 * 60 * 60 * 24; // 24 hours — tune later

export async function createSession(userId: string) {
  return prisma.session.create({
    data: { userId, expiresAt: new Date(Date.now() + SESSION_LIFETIME_MS) },
  });
}

export async function getValidSession(sessionId: string) {
  const session = await prisma.session.findUnique({ where: { id: sessionId } });
  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { id: sessionId } }).catch(() => {});
    return null;
  }
  return session;
}

export async function deleteSession(sessionId: string) {
  await prisma.session.delete({ where: { id: sessionId } }).catch(() => {});
}

export async function deleteAllSessionsForUser(userId: string) {
  await prisma.session.deleteMany({ where: { userId } });
}
```

### 6. Rewrite `app/lib/auth.ts`

This is the one function everything else should call from now on.

```ts
import { cookies } from "next/headers";
import { prisma } from "@/app/lib/prisma";
import { verifySessionToken } from "@/app/lib/jwt";
import { getValidSession } from "@/app/lib/session";

const SESSION_COOKIE_NAME = "logistiq_session";

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const decoded = verifySessionToken(token);      // wristband check — fast, no DB hit
  if (!decoded) return null;

  const session = await getValidSession(decoded.sid); // guest list check — the real authority
  if (!session) return null;

  return prisma.user.findUnique({ where: { id: session.userId } });
}

export async function isAuthenticated(): Promise<boolean> {
  return Boolean(await getCurrentUser());
}

export { SESSION_COOKIE_NAME };
```

### 7. Edit `app/api/auth/sign-in/route.ts`

After the existing `bcrypt.compare` check succeeds, replace the cookie-setting block:

```ts
import { createSession } from "@/app/lib/session";
import { signSessionToken } from "@/app/lib/jwt";

// ...after passwordMatches check succeeds...
const session = await createSession(user.id);
const token = signSessionToken(session.id);

cookieStore.set({
  name: SESSION_COOKIE_NAME,
  value: token,
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: 60 * 60 * 24 * 30, // the browser can hold onto this for 30 days —
                              // the Session row's own expiresAt is what actually gates access
});
```

### 8. Edit `app/api/auth/sign-out/route.ts`

Delete the database row, don't just clear the cookie:

```ts
import { verifySessionToken } from "@/app/lib/jwt";
import { deleteSession } from "@/app/lib/session";

const cookieStore = await cookies();
const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
if (token) {
  const decoded = verifySessionToken(token);
  if (decoded) await deleteSession(decoded.sid);
}
cookieStore.delete(SESSION_COOKIE_NAME);
```

### 9. Edit `app/dashboard/layout.tsx` and `app/dashboard/page.tsx`

Both currently read the cookie and query Prisma directly (that duplication is exactly what section 1/6 of the guide warns about — the same check written twice means it can drift out of sync). Replace both with:

```ts
import { getCurrentUser } from "@/app/lib/auth";

const user = await getCurrentUser();
if (!user) redirect("/sign-in");
```

## How to verify it actually worked

1. Sign in, then open DevTools → Application → Cookies. `logistiq_session` should now be a long string with two dots in it (a JWT has three base64 segments) — not a short id.
2. Run `npx prisma studio` and confirm a row appeared in `Session` after you signed in.
3. Sign out, and confirm that row disappears from `Session`.
4. Tamper test: sign in, copy the cookie value somewhere, change one character of it in DevTools, refresh the dashboard. You should get redirected to sign-in — this is the signature check failing.
5. Revocation test: sign in, copy the *valid* cookie value before signing out. Sign out normally. Manually paste the old, still-cryptographically-valid cookie value back into DevTools and refresh. You should still get redirected — this is the database check failing even though the token itself is intact, which is the entire point of doing both.

## Deliberately left out of Step 1

- **Sliding-window auto-extend** (the guide's "stays logged in while you're actively using it" idea) and the "Still there?" popup — worth adding, but it's a refinement on top of a working session system, not a prerequisite for closing the security gap.
- **Careful secret rotation** — section 9 of the guide flags that regenerating `SESSION_SECRET` instantly logs out every signed-in user. Not a concern until this is deployed with real users on it.
