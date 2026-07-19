# Step 3 — Warehouse & Inventory Actions

Companion to `CharterRoute_Pattern_StepByStep_Guide.pdf`, Step 3 ("One Front Door for Every Request") and Step 5 ("Your First Features"), applied to Logistiq. This doc tells you what to build and why, in order. You're writing the code — nothing here gets applied automatically.

**Scope of this step:** `Warehouse` and `InventoryItem` have existed in `schema.prisma` since Step 2, but nothing can read or write them yet — no registered actions, so they're invisible to the app. This step wires them up: `createWarehouse`, `listWarehouses`, `adjustStock`, `listInventory`, and `lowStock`. Suppliers/purchase orders and customers/sales orders are **Step 4** — they depend on nothing added here, so there's no reason to block on them.

## Why this is Step 3

Step 2's own "deliberately left out" list called this out directly: *"nothing stops a handler from forgetting to filter by `organizationId`... that's Step 3 territory (the API layer)."* This is that layer. Every query below filters on `ctx.organizationId` on purpose, everywhere — not because Prisma requires it, but because nothing else does. Skipping the filter on any one of these wouldn't error out; it would just quietly let one company read or edit another company's stock.

There's also a very concrete payoff: `app/dashboard/page.tsx` currently renders `REORDER_ITEMS` and `ACTIVITY` from hardcoded mock arrays at the top of the file. `lowStock` and `adjustStock` are what those arrays get replaced with — this step is what turns the dashboard from a mockup into a real page, even though wiring the dashboard itself is a later, separate pass.

One more thing worth noticing before you start: you already hit the exact bug this step is designed to prevent. `app/modules/products/product.ts` had `createProduct`/`listProducts` written and registered, but nothing ever imported the file, so the registry was empty and every request 400'd with "Unknown action." The fix was importing `@/app/modules` from `route.ts`, and having `app/modules/index.ts` re-export every feature file. As long as you keep adding new modules to `app/modules/index.ts`, this won't bite you again — that's why step 2 below exists.

## The new folder structure

```
logistiq/
├─ app/
│  ├─ modules/
│  │  ├─ index.ts                      # EDIT: import the two new files below
│  │  ├─ products/
│  │  │  └─ product.ts                 # unchanged — the pattern to copy
│  │  ├─ warehouses/
│  │  │  └─ warehouse.ts               # NEW: createWarehouse, listWarehouses
│  │  └─ inventory/
│  │     └─ inventory.ts               # NEW: adjustStock, listInventory, lowStock
```

## Do it in this order

### 1. Write `app/modules/warehouses/warehouse.ts`

Same shape as `product.ts`: import `register`, import `prisma`, call `register(name, handler)` once per action.

```ts
import { register } from "@/app/lib/registry";
import { prisma } from "@/app/lib/prisma";

register("listWarehouses", async (_data, ctx) => {
    const warehouses = await prisma.warehouse.findMany({
        where: { organizationId: ctx.organizationId },
    });
    return { status: 200, body: { warehouses } };
});

register("createWarehouse", async (data, ctx) => {
    const { name, code } = data;

    if (!name || !code) {
        return { status: 400, body: { error: "name and code are required." } };
    }

    const warehouse = await prisma.warehouse.create({
        data: { organizationId: ctx.organizationId, name, code },
    });
    return { status: 201, body: { warehouse } };
});
```

Note the field name is `data.action` you're matching against inside `orchestrate.ts` (`const action = data.action;`) — not `data.request` like the generic PDF uses. Postman bodies for this step look like `{"action": "createWarehouse", "name": "Warehouse A", "code": "WH-A"}`.

`code` has a `@@unique([organizationId, code])` constraint from Step 2, so creating two warehouses with the same code under one organization will throw a Prisma error you're not catching yet — that's fine for now (it surfaces as a 500), and worth revisiting once you add real form validation.

### 2. Write `app/modules/inventory/inventory.ts`

This is the one with the actual judgment calls in it. Three actions:

```ts
import { register } from "@/app/lib/registry";
import { prisma } from "@/app/lib/prisma";

// Moves stock by a relative amount (positive to add, negative to remove) —
// not an absolute "set to X", so two people adjusting the same item around
// the same time don't stomp on each other's change.
register("adjustStock", async (data, ctx) => {
    const { productId, warehouseId, delta } = data;

    if (!productId || !warehouseId || typeof delta !== "number" || delta === 0) {
        return {
            status: 400,
            body: { error: "productId, warehouseId, and a non-zero numeric delta are required." },
        };
    }

    // Confirm both actually belong to this organization before touching anything —
    // without this, a crafted request could adjust another company's stock just
    // by guessing a valid-looking product/warehouse id.
    const [product, warehouse] = await Promise.all([
        prisma.product.findFirst({ where: { id: productId, organizationId: ctx.organizationId } }),
        prisma.warehouse.findFirst({ where: { id: warehouseId, organizationId: ctx.organizationId } }),
    ]);
    if (!product || !warehouse) {
        return { status: 404, body: { error: "Product or warehouse not found." } };
    }

    const existing = await prisma.inventoryItem.findUnique({
        where: { productId_warehouseId: { productId, warehouseId } },
    });

    const nextQuantity = (existing?.quantity ?? 0) + delta;
    if (nextQuantity < 0) {
        return { status: 400, body: { error: "That would take stock below zero." } };
    }

    const item = await prisma.inventoryItem.upsert({
        where: { productId_warehouseId: { productId, warehouseId } },
        create: { productId, warehouseId, quantity: nextQuantity },
        update: { quantity: nextQuantity },
    });

    return { status: 200, body: { item } };
});

// Optionally scoped by warehouseId and/or productId via the request body.
register("listInventory", async (data, ctx) => {
    const { warehouseId, productId } = data;

    const items = await prisma.inventoryItem.findMany({
        where: {
            product: { organizationId: ctx.organizationId },
            warehouse: { organizationId: ctx.organizationId },
            ...(warehouseId ? { warehouseId } : {}),
            ...(productId ? { productId } : {}),
        },
        include: { product: true, warehouse: true },
    });

    return { status: 200, body: { items } };
});

// Products whose stock, summed across every warehouse, is at or below
// their reorderPoint. This is what "Products to reorder" on the
// dashboard should eventually query instead of its mock array.
register("lowStock", async (_data, ctx) => {
    const products = await prisma.product.findMany({
        where: { organizationId: ctx.organizationId },
        include: { inventoryItems: true },
    });

    const lowStock = products
        .map((p) => ({
            ...p,
            totalQuantity: p.inventoryItems.reduce((sum, i) => sum + i.quantity, 0),
        }))
        .filter((p) => p.totalQuantity <= p.reorderPoint);

    return { status: 200, body: { products: lowStock } };
});
```

A few design choices worth understanding, not just copying:

- **`adjustStock` takes a `delta`, not a `quantity`.** "Set this to 50" loses information (was it a sale, a restock, a correction?) and is dangerous if two requests race — whichever `update` lands last silently wins and the other is lost. "Add -3" and "add +500" are both safe to apply independently, in any order, and map directly onto the dashboard's `-12 units` / `+500 units` activity feed.
- **The negative-quantity check happens before the write, using a separate `findUnique`.** This isn't fully race-proof — two simultaneous `adjustStock` calls could both read the same starting quantity and both think they're safe. That's a known, deliberate simplification; see "left out" below.
- **`productId_warehouseId` as the `where` key.** This is the compound key Prisma auto-generates from `@@unique([productId, warehouseId])` on `InventoryItem` — Prisma names it `field1_field2` in the order they appear in the schema. If your migration named fields differently, run `npx prisma generate` and check the autocomplete on `.upsert({ where: { ` to confirm the exact key name.
- **`lowStock` filters in JavaScript, not in the Prisma `where` clause.** Comparing a computed sum (`totalQuantity`) against another column (`reorderPoint`) isn't expressible as a plain Prisma filter — it'd need raw SQL. For the scale you're at, pulling every product with its inventory rows and filtering in memory is simpler and fast enough; worth revisiting with raw SQL only if the product list gets large.

### 3. Wire both files into `app/modules/index.ts`

```ts
// Where my feature files will be
import "./products/product";
import "./warehouses/warehouse";
import "./inventory/inventory";
```

This is the whole reason the `createProduct`/`listProducts` bug happened in the first place — `route.ts` only imports `@/app/modules` (this file), so anything not listed here is dead code as far as the registry is concerned. Every future module gets added here, nowhere else.

## How to verify it actually worked

1. Sign in via Postman (`POST /api/auth/sign-in`), then `POST /api/requests` with `{"action": "createWarehouse", "name": "Warehouse A", "code": "WH-A"}` — expect a 201 with the created warehouse. Repeat for a second warehouse, `WH-B`.
2. `{"action": "listWarehouses"}` — expect both back.
3. Create a product first (`{"action": "createProduct", "sku": "SKU-1", "name": "Test Widget"}`), then `{"action": "adjustStock", "productId": "<id>", "warehouseId": "<WH-A id>", "delta": 20}` — expect a 200 with `quantity: 20`.
4. Run the same `adjustStock` call again with `delta: -25` — expect a 400 ("That would take stock below zero"), proving the floor works.
5. `{"action": "listInventory"}` with no filters — expect the one item back, `quantity: 20`. Retry with `{"warehouseId": "<WH-B id>"}` — expect an empty array, proving the scoping works.
6. Set the test product's `reorderPoint` above 20 directly in Prisma Studio, then call `{"action": "lowStock"}` — the product should now show up. Set `reorderPoint` back below 20 and confirm it disappears.
7. Cross-tenant check: sign in as a *different* organization's user (or sign up a second company) and try `adjustStock` against the first organization's `productId`/`warehouseId` — expect a 404, proving the ownership check on step 1 of `adjustStock` actually blocks it, not just filters it out silently.

## Deliberately left out of Step 3

- **Race-condition-proof stock adjustment.** The current `findUnique` → check → `upsert` isn't wrapped in a database transaction, so two truly simultaneous `adjustStock` calls on the same item could both pass the negative-quantity check before either write lands. Fixing this properly means either a Prisma `$transaction` with a row lock, or an atomic conditional update — worth doing before this handles real concurrent traffic, not necessary while you're the only one testing it.
- **Transfers between warehouses as one atomic action.** Right now, moving stock from Warehouse A to B is two separate `adjustStock` calls from the client (a `-N` and a `+N`) — if the second one fails, you're left with stock that vanished. A dedicated `transferStock` action wrapping both in a `$transaction` is the correct fix, and a natural Step 3b once this is working.
- **Persisted inventory activity log.** `adjustStock` only ever leaves you with the *current* quantity — there's no row anywhere recording "this dropped by 12 units, here's why, here's when." That's a new model (something like `InventoryEvent`), needed to make the dashboard's "Recent inventory activity" table real instead of mocked.
- **Suppliers, purchase orders, customers, sales orders.** All of the remaining mocked dashboard cards (`Open purchase orders`, `Top customers`, `Unpaid sales orders`, the revenue chart) hang off models that don't exist yet. Step 4.
