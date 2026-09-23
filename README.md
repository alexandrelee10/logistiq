# Logistiq

Multi-tenant inventory and warehouse management app — products, stock, purchasing, sales, and an
in-app AI copilot, built with Next.js App Router, Prisma, and Postgres.

## Tech stack

- **Next.js 16** (App Router, React 19) — see `AGENTS.md`, this is a newer major version than most
  training data covers; check `node_modules/next/dist/docs/` before assuming an API works the old way.
- **Prisma 7** + **Postgres** (via `@prisma/adapter-pg`), client generated into `generated/prisma`
  (not the default `node_modules/.prisma` location).
- **Tailwind CSS 4**, **Zod 4** for validation, **JWT-based sessions** (`jsonwebtoken` + `bcryptjs`).
- **Anthropic SDK** — powers an in-app copilot (`app/api/copilot/route.ts`).
- **Vitest** for unit tests.

## Getting started

1. Copy `.env.example` to `.env` and fill in:
   - `DATABASE_URL` — Postgres connection string. Provision a free hosted one instantly with
     `npx create-db`, or point at a local Postgres instance.
   - `SESSION_SECRET` — at least 32 characters; signs session JWTs.
   - `ANTHROPIC_API_KEY` — needed for the copilot route; get one from the Anthropic Console.
   - (`NODE_ENV` defaults to `development`, no need to set it locally.)

   All of these are validated in `app/lib/env.ts` at startup — a missing/short value fails immediately
   with a clear error instead of breaking somewhere unrelated later.

2. Install dependencies (this also runs `prisma generate` via `postinstall`), then run migrations:
   ```bash
   npm install
   npx prisma migrate dev
   ```

3. Run it:
   ```bash
   npm run dev
   ```
   Open http://localhost:3000. Sign up to create a new organization (there's currently no "join an
   existing org" flow via the UI — see **Known gaps** below).

Other scripts: `npm run build`, `npm run lint`, `npm test` (Vitest — unit tests live next to the code
they test, e.g. `app/lib/permission.test.ts`). `scripts/` has one-off maintenance scripts
(`backfill-order-numbers.ts`, `seed-test-warehouses.ts`), run with `tsx`.

## Where to start reading

**`docs/product/logistiq-audit.md`** — a point-in-time (2026-07-30) audit of what was solid vs. broken
in the auth flow, ranked by impact. Worth reading for the reasoning behind decisions like "why does
`validations/auth.ts` deliberately not have a `role` field" — but note **every item it flagged has
since been fixed** (invite acceptance page, join-via-invite flow, forced-admin-on-signup, password
confirmation, auto-login after sign-up, invite expiry check are all live in `app/api/auth/*` and
`validations/auth.ts` today). Treat it as historical context, not a current punch list.

**`docs/product/flows/*.png`** — flowcharts for the core user journeys (sign-up, sign-in, invitation
creation, dashboard, add/view inventory, purchase order, sales/payment, copilot API).

**`supplier-and-edit-guide.pdf`** (repo root) — walkthrough of the supplier and product-edit UI.

There is no `docs/STATUS.md` or route directory doc yet — if you add one, link it here.

## How the app is put together

- **`app/dashboard/**/page.tsx`** — one Server Component per route. Fetches its own data with
  `orchestrate()`, checks the current user's role, and renders. Never talks to Prisma directly.
- **`app/modules/*/*.ts`** — the actual business logic. Each file `register()`s named actions
  (`createProduct`, `listInventory`, ...) against a shared registry (`app/lib/registry.ts`).
- **`app/lib/orchestrate.ts`** — looks up an action by name, checks `isActionAllowed()` from
  `app/lib/permission.ts`, then runs the handler. Pages call this directly (server-side); the browser
  calls it indirectly through `app/api/requests/route.ts`.
- **`app/lib/permission.ts`** — the single source of truth for "which roles can do X." Roles:
  `ADMIN`, `MANAGER` (always allowed), `WAREHOUSE_STAFF`, `PURCHASING`, `ACCOUNTING`, `VIEWER`.
  UI-level checks (hiding a button) should mirror this list but remember it isn't the enforcement layer
  — `isActionAllowed()` is.
- **`app/components/dashboard/*`** — Client Components (`"use client"`) for anything interactive:
  modals, tables with filters, tabs. They receive plain data as props from the Server Component page
  that renders them; they don't fetch data themselves.

Every action flows one way: **page.tsx (server) → orchestrate() → permission check → registered
handler → Prisma.** If something needs a new piece of data, the handler goes in `app/modules/`, not
inline in a component.

## Data model

Everything in `prisma/schema.prisma` is scoped by `organizationId` — this is a multi-tenant app by
construction. Core models: `User`, `Session`, `Organization`, `Invite`, `Category`, `Product`,
`Warehouse`, `InventoryItem` (current on-hand state) + `InventoryRecord` (append-only ledger of every
change, with delta/reason/userId — this is the audit trail, don't write to `InventoryItem` directly
without also writing a record), `Supplier`, `PurchaseOrder` + `PurchaseOrderLine`, `Customer`,
`SalesOrder` + `SalesOrderLine`, `Payment`, `OrderSequence` (generates human-readable order numbers).

`PurchaseOrderStatus` moves through `draft → submitted → approved → received/partially_received →
confirmed`, or `cancelled`, at any point before it's terminal.

## Roles & permissions

Six roles (`USERROLE` enum): `ADMIN`, `MANAGER` (both always-allowed everywhere), `WAREHOUSE_STAFF`,
`PURCHASING`, `ACCOUNTING`, `VIEWER` (read-mostly). The full action → role map lives in
`app/lib/permission.ts` — read it rather than guessing from the UI; a missing entry defaults to
admin/manager-only (`isActionAllowed`'s fallback). Roughly:

- **Warehouse staff**: inventory adjustments/transfers, fulfilling sales orders, receiving POs.
- **Purchasing**: suppliers, purchase orders (create/submit/cancel — approval is admin/manager-only).
- **Accounting**: customers, sales orders, payments.
- Most `list*`/read actions are open to Viewer too; almost everything else needs the specific role
  above it or admin/manager.

## Conventions worth knowing before writing new UI

- **Controlled number/text inputs** store the raw string in state and parse to a real type only at
  submit time — parsing on every keystroke breaks typing (leading zeros vanish, cursor jumps). See
  `price` in `Inventory/products/CreateProductModal.tsx` for the reference implementation.
- **One component, multiple entry points** beats copy-pasting a near-duplicate.
  `Inventory/reorder/ReorderModal.tsx` takes either `product` (locked) or `products` (picker) as props
  rather than existing twice.
- **Discriminated unions over multiple booleans** for state that can only be one of a few shapes — see
  `ReorderTarget = ProductRow | "any" | null` in `Inventory/products/ProductsTable.tsx`.
- **A route isn't a feature until it's reachable.** Building `[id]/page.tsx` isn't enough — something in
  the UI has to actually link to it (see the product table's row `onClick`).
- **Nested clickables need `e.stopPropagation()`** on the inner element, or both handlers fire.

