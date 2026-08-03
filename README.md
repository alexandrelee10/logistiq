# Logistiq

Inventory and warehouse management app — products, stock, purchasing, and (eventually) sales, built
with Next.js App Router, Prisma, and Postgres.

## Getting started

1. Copy `.env` and set:
   - `DATABASE_URL` — Postgres connection string
   - `SESSION_SECRET` — at least 32 characters; signs session JWTs
   - (`NODE_ENV` defaults to `development`, no need to set it locally)

   Validated in `app/lib/env.ts` at startup — a missing/short value fails immediately with a clear error
   instead of breaking somewhere unrelated later.

2. Install and generate the Prisma client:
   ```bash
   npm install
   npx prisma migrate dev
   ```

3. Run it:
   ```bash
   npm run dev
   ```
   Open http://localhost:3000.

Other scripts: `npm run build`, `npm run lint`, `npm test` (Vitest — unit tests live next to the code
they test, e.g. `app/lib/permission.test.ts`).

## Where to start reading

**`docs/STATUS.md`** — what's done, what's in progress, and what to do next. Always check this first.

**`docs/ROUTE_DIRECTORY.md`** — every route in the app, whether it's live, and which sidebar links are
currently broken.

**`docs/guides/`** — PDF walkthroughs of specific decisions made in this codebase (why a component is a
Client Component, why a form field is stored as a string not a number, etc.) — written to explain
reasoning, not just describe what changed.

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

`docs/guides/Logistiq_Inventory_Features_Explained.pdf` covers all of the above in depth, with the
actual before/after code from this repo.
