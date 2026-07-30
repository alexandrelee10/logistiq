# Logistiq Product Audit

_Last updated: 2026-07-30 — based on reading `prisma/schema.prisma`, `app/api/auth/*`, `app/components/auth/*`, `app/lib/*`, `app/modules/*`, `app/dashboard/*` and comparing against the research in `docs/research/inventory-copilot-research.md`._

## What's already solid

- **Append-only inventory ledger.** `InventoryRecord` (delta + reason + userId) alongside the current-state `InventoryItem` is exactly the audit-trail pattern that separates pro tooling from spreadsheets.
- **Real PO state machine.** `PurchaseOrderStatus` (`draft → submitted → approved → received/partially_received/confirmed`, plus `cancelled`) matches the "PO discipline" practice from the research.
- **Central permission map.** `app/lib/permission.ts` is a clean, single-file ACTION_ROLES map keyed by action rather than scattered role checks — easy to audit and extend as new modules are added.
- **Multi-tenant by construction.** Every core model is scoped by `organizationId`, and the `orchestrate`/`register` pattern in `app/lib/orchestrate.ts` + `app/modules/*` passes an org-scoped `ctx` into every action — good foundation for the "one system of record" practice.
- **Dashboard already reflects real pro workflows**: reorder list, open POs, top products/customers, revenue trend, unpaid sales orders, recent inventory activity — this is close to what Cin7/Katana show on their home dashboards.

## Gaps found, ranked by impact

### 1. The invite-acceptance flow is broken end-to-end (highest impact)
`app/modules/teams/teams.ts` generates `acceptUrl: /accept-invite?token=${invite.token}` when an admin invites someone — but there is no `app/(auth)/accept-invite/page.tsx`. The `POST /api/auth/accept-invite` API exists and works, but nothing in the UI calls it. **Today, an invited teammate who clicks their invite link hits a 404.** This is the single biggest gap relative to your own PDF, which explicitly designs for an invite-link/code join path.

### 2. Sign-up has no "join an organization" path at all
Your PDF's flowchart branches into **Create organization** vs **Join organization** right after the base form. The live `SignUpForm.tsx` / `POST /api/auth/sign-up` only supports creating a brand-new org — every signup becomes a new org, unconditionally. There's no way to reach the join path from `/sign-up` in the first place; a teammate has to already have a working direct link (which, per #1, doesn't work anyway).

### 3. New org creators pick their own role from a dropdown
`SignUpForm.tsx` shows a Role selector (Admin/Manager/Warehouse Staff/Purchasing/Accounting/Viewer) to someone who is, by definition, creating a brand-new organization with no other members yet. Nothing stops them from creating an org and setting themselves to `VIEWER`, locking themselves out of their own org's admin actions. Your PDF's intent — "Become owner → Set role to owner" — isn't implemented; there's no OWNER role in the schema at all (`USERROLE` tops out at `ADMIN`). Since `app/lib/permission.ts` already treats `ADMIN` as the top permission tier everywhere, the fix doesn't need a schema migration — it just needs the role selector removed for org creators and the server to force `ADMIN`.

### 4. No password confirmation field, anywhere
Neither sign-up nor accept-invite asks for the password twice. A typo in an 8+ character password field with no visual feedback is a common first-login lockout cause — cheap to fix, meaningfully reduces support burden.

### 5. Forced re-login immediately after signing up
`SignUpForm.tsx` redirects to `/sign-in?created=1` on success instead of signing the user in. The sign-in route (`app/api/auth/sign-in/route.ts`) already has all the session-creation logic (`createSession` + `signInSessionToken` + cookie) — the sign-up and accept-invite routes just don't call it. This is friction with no security benefit (the server already verified the password once).

### 6. Invite expiry isn't actually checked on acceptance
`POST /api/auth/accept-invite` checks `invite.status !== "pending"` but never checks `invite.expiresAt`, even though `createInvite` sets a 7-day TTL. A stale invite link works forever today.

### 7. Required phone number may be unnecessary friction
`phoneNumber` is required and globally unique on `User`. None of the competitor sign-up flows researched require a phone number up front — it's usually optional or collected only for 2FA later. Not urgent, but worth a product decision (flagged here, not changed — would require a schema migration, out of scope for this pass).

### 8. No email verification
Nobody researched treats this as a signup blocker for B2B tools (Zoho/Cin7/inFlow all let you use the product before verifying), so this is a "nice to have later," not a gap that blocks the redesign — noted for the roadmap.

## What this pass fixes vs. defers

**Fixing now** (see `docs/product/flows/sign-up-flow.md` for the redesigned flow): #1, #2, #3, #4, #5, #6.

**Deferred to the roadmap** (`docs/product/flows/README.md`): #7 (optional phone number — needs a migration), #8 (email verification), plus every other flow (sign-in, dashboard, add/view inventory, invitation creation) that wasn't in scope for this pass.
