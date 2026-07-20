# Step 3b — Race-Safe Adjustments, Transfers, and an Activity Log

Companion to `docs/step-3-warehouse-inventory-actions.md`'s "Deliberately left out" section — this is those three items, done together, because they share one piece of machinery. This doc tells you what to build and why, in order. You're writing the code — nothing here gets applied automatically.

**Scope of this step:** a row-locked helper that makes `adjustStock` actually safe under concurrent requests, a `transferStock` action built on that same helper, and an `InventoryEvent` model so every stock change leaves a permanent record instead of just overwriting `quantity`.

## Why these three are one step, not three

`transferStock` is just two calls to "change this item's quantity by some delta," done atomically — which is exactly what a race-safe `adjustStock` already needs internally. And once you're wrapping a stock change in a transaction anyway, writing the `InventoryEvent` row in that same transaction is free: either the quantity changes and the event is recorded, or neither happens. Building all three separately would mean writing the locking logic three times and having it drift out of sync; building them together means writing it once, in `app/lib/inventory.ts`, and having `adjustStock`, `transferStock`, and anything else you add later all call the same function.

## The actual bug in the current code

```ts
const existingInventory = await prisma.inventoryItem.findUnique({
    where: { productId_warehouseId: { productId, warehouseId } }
});
const nextQuantity = (existingInventory?.quantity ?? 0) + delta;
if (nextQuantity < 0) {
    return { status: 400, body: { error: "That would take stock below zero." } };
}
const item = await prisma.inventoryItem.upsert({ ...update: { quantity: nextQuantity }... });
```

This isn't just "could theoretically be a problem" — walk through what happens if two `adjustStock` calls for the same item land within a few milliseconds of each other, say `delta: -8` and `delta: -5` on a starting quantity of 10:

1. Request A reads quantity `10`, computes `nextQuantity = 2`, passes the zero-check.
2. Request B reads quantity `10` (A hasn't written yet), computes `nextQuantity = 5`, passes the zero-check.
3. Request A writes `quantity: 2`.
4. Request B writes `quantity: 5`.

Final quantity is `5` — but 8 + 5 = 13 units left the warehouse, so it should be `10 - 13 = -3`, which should have been rejected outright. Instead you silently lost request A's decrement *and* let total stock go negative in spirit, just not in the number sitting in the column. This is the classic "lost update" — and it's a straight-up write, not an edge case that needs unlucky timing to matter once more than one person (or one retried request) touches the app.

## The new folder structure

```
logistiq/
├─ prisma/
│  └─ schema.prisma                    # ADD: InventoryEvent model + relations on Product/Warehouse
├─ app/
│  ├─ lib/
│  │  └─ inventory.ts                  # NEW: applyStockDelta() — the shared, row-locked helper
│  └─ modules/
│     └─ inventory/
│        └─ inventory.ts               # EDIT: adjustStock rewritten, transferStock + listInventoryEvents added
```

## Do it in this order

### 1. Add `InventoryEvent` to `prisma/schema.prisma`

```prisma
model InventoryEvent {
  id String @id @default(cuid())

  productId String
  product   Product @relation(fields: [productId], references: [id], onDelete: Cascade)

  warehouseId String
  warehouse   Warehouse @relation(fields: [warehouseId], references: [id], onDelete: Cascade)

  delta  Int      // positive = added, negative = removed
  reason String?
  userId String?

  createdAt DateTime @default(now())
}
```

And add the back-relations so Prisma's schema stays bidirectionally consistent:

```prisma
model Product {
  // ...existing fields...
  inventoryEvents InventoryEvent[]
}

model Warehouse {
  // ...existing fields...
  inventoryEvents InventoryEvent[]
}
```

`delta` is signed (not a separate "type: in/out" column) on purpose — it's the same shape `adjustStock` already takes as input, so writing the event is a direct pass-through of a value you already have, not a translation step that could get the sign backwards. `userId` and `reason` are both optional: `userId` because system-generated adjustments (a future webhook, a scheduled job) won't always have a human behind them; `reason` because you don't have a fixed taxonomy of reasons yet, and forcing one now would mean guessing.

Migrate:

```
npx prisma migrate dev --name add_inventory_events
```

### 2. Write `app/lib/inventory.ts`

This is the one function every stock-changing action should call from now on — same "one shared piece of logic, not duplicated per-handler" idea as `auth.ts` from Step 1.

```ts
import type { Prisma } from "@/generated/prisma/client";

export class StockBelowZeroError extends Error {
    constructor() {
        super("That would take stock below zero.");
    }
}

// Must be called with `tx` from inside an active prisma.$transaction(async (tx) => ...) —
// this is what makes the lock below actually mean something. Calling it with the
// top-level `prisma` client instead would run the SELECT and the write as two
// separate statements again, silently undoing the whole point of this function.
export async function applyStockDelta(
    tx: Prisma.TransactionClient,
    productId: string,
    warehouseId: string,
    delta: number
) {
    // FOR UPDATE locks this row (if it exists) for the rest of the transaction.
    // A second, truly simultaneous call for the same product+warehouse pair has
    // to wait right here until this transaction commits or rolls back — it can
    // no longer read the same stale quantity and race to overwrite this one.
    const rows = await tx.$queryRaw<{ quantity: number }[]>`
        SELECT quantity FROM "InventoryItem"
        WHERE "productId" = ${productId} AND "warehouseId" = ${warehouseId}
        FOR UPDATE
    `;

    const currentQuantity = rows[0]?.quantity ?? 0;
    const nextQuantity = currentQuantity + delta;

    if (nextQuantity < 0) {
        throw new StockBelowZeroError();
    }

    return tx.inventoryItem.upsert({
        where: { productId_warehouseId: { productId, warehouseId } },
        create: { productId, warehouseId, quantity: nextQuantity },
        update: { quantity: nextQuantity },
    });
}
```

Worth understanding, not just copying:

- **Throwing, not returning `{ status, body }`, on the negative-stock case.** This function runs inside a Prisma transaction callback — throwing is what tells Prisma "roll every write in this transaction back," including a sibling `applyStockDelta` call that already succeeded earlier in the same transaction (this matters a lot for `transferStock` below). Returning an error object instead would let the transaction commit anyway, which is exactly wrong.
- **`FOR UPDATE` only locks a row that already exists.** The very first-ever adjustment for a brand-new `(productId, warehouseId)` pair has nothing to lock, so two truly simultaneous "first touches" of the same pair could both reach the `create` branch of the `upsert`. That's not silently wrong, though — `InventoryItem`'s `@@unique([productId, warehouseId])` constraint means the loser of that race gets a Prisma `P2002` instead, which `route.ts`'s `catch` block already turns into a clean `409`. Worth knowing about, not worth building extra machinery to prevent — the client can just retry.
- **This is a raw SQL query (`$queryRaw`), because `FOR UPDATE` isn't something Prisma's normal query builder can express.** The double-quoted `"InventoryItem"`, `"productId"`, `"warehouseId"` are deliberate — Postgres folds unquoted identifiers to lowercase, and your columns are camelCase, so unquoted SQL here would silently fail to match anything.

### 3. Rewrite `adjustStock` in `app/modules/inventory/inventory.ts`

```ts
import { prisma } from "@/app/lib/prisma";
import { register } from "@/app/lib/registry";
import { applyStockDelta, StockBelowZeroError } from "@/app/lib/inventory";

register("adjustStock", async (data, ctx) => {
    const { productId, warehouseId, delta, reason } = data;

    if (!productId || !warehouseId || typeof delta !== "number" || delta === 0) {
        return {
            status: 400,
            body: { error: "productId, warehouseId, and a non-zero numeric delta are required." },
        };
    }

    const [product, warehouse] = await Promise.all([
        prisma.product.findFirst({ where: { id: productId, organizationId: ctx.organizationId } }),
        prisma.warehouse.findFirst({ where: { id: warehouseId, organizationId: ctx.organizationId } }),
    ]);
    if (!product || !warehouse) {
        return { status: 404, body: { error: "Product or warehouse not found." } };
    }

    try {
        const item = await prisma.$transaction(async (tx) => {
            const item = await applyStockDelta(tx, productId, warehouseId, delta);
            await tx.inventoryEvent.create({
                data: { productId, warehouseId, delta, reason: reason ?? null, userId: ctx.userId },
            });
            return item;
        });

        return { status: 200, body: { item } };
    } catch (err) {
        if (err instanceof StockBelowZeroError) {
            return { status: 400, body: { error: err.message } };
        }
        throw err; // anything else (e.g. a real DB error) falls through to route.ts's catch
    }
});
```

The ownership check (the `Promise.all` block) stays *outside* the transaction — there's no reason to hold a database transaction open while you're doing a read that has nothing to do with the write you're about to make. Only the lock-check-write sequence that actually needs atomicity goes inside `$transaction`.

### 4. Add `transferStock`, in the same file

```ts
register("transferStock", async (data, ctx) => {
    const { productId, fromWarehouseId, toWarehouseId, quantity, reason } = data;

    if (
        !productId ||
        !fromWarehouseId ||
        !toWarehouseId ||
        typeof quantity !== "number" ||
        quantity <= 0
    ) {
        return {
            status: 400,
            body: {
                error: "productId, fromWarehouseId, toWarehouseId, and a positive quantity are required.",
            },
        };
    }
    if (fromWarehouseId === toWarehouseId) {
        return { status: 400, body: { error: "Source and destination warehouses must be different." } };
    }

    const [product, fromWarehouse, toWarehouse] = await Promise.all([
        prisma.product.findFirst({ where: { id: productId, organizationId: ctx.organizationId } }),
        prisma.warehouse.findFirst({ where: { id: fromWarehouseId, organizationId: ctx.organizationId } }),
        prisma.warehouse.findFirst({ where: { id: toWarehouseId, organizationId: ctx.organizationId } }),
    ]);
    if (!product || !fromWarehouse || !toWarehouse) {
        return { status: 404, body: { error: "Product or warehouse not found." } };
    }

    try {
        const result = await prisma.$transaction(async (tx) => {
            const fromItem = await applyStockDelta(tx, productId, fromWarehouseId, -quantity);
            const toItem = await applyStockDelta(tx, productId, toWarehouseId, quantity);

            await tx.inventoryEvent.createMany({
                data: [
                    {
                        productId,
                        warehouseId: fromWarehouseId,
                        delta: -quantity,
                        reason: reason ?? "transfer out",
                        userId: ctx.userId,
                    },
                    {
                        productId,
                        warehouseId: toWarehouseId,
                        delta: quantity,
                        reason: reason ?? "transfer in",
                        userId: ctx.userId,
                    },
                ],
            });

            return { fromItem, toItem };
        });

        return { status: 200, body: result };
    } catch (err) {
        if (err instanceof StockBelowZeroError) {
            return { status: 400, body: { error: "Not enough stock in the source warehouse." } };
        }
        throw err;
    }
});
```

Notice `transferStock` takes a positive `quantity` (an amount to move), not two deltas — the sign-flipping (`-quantity` out, `+quantity` in) happens inside the handler, so the client can't accidentally send mismatched amounts to the two sides of a transfer. And because both `applyStockDelta` calls run inside one `$transaction`, if the *destination* write somehow failed after the *source* write already succeeded, Postgres rolls the source deduction back too — that's the "stock vanished" bug from the doc's "deliberately left out" note, fixed by construction rather than by remembering to handle it.

### 5. Add `listInventoryEvents`

```ts
register("listInventoryEvents", async (data, ctx) => {
    const { productId, warehouseId, limit } = data;

    const events = await prisma.inventoryEvent.findMany({
        where: {
            product: { organizationId: ctx.organizationId },
            warehouse: { organizationId: ctx.organizationId },
            ...(productId ? { productId } : {}),
            ...(warehouseId ? { warehouseId } : {}),
        },
        include: { product: true, warehouse: true },
        orderBy: { createdAt: "desc" },
        take: typeof limit === "number" ? limit : 20,
    });

    return { status: 200, body: { events } };
});
```

This is what the dashboard's "Recent inventory activity" table should eventually call instead of reading its mocked `ACTIVITY` array — that's a separate frontend pass, not part of this step.

## How to verify it actually worked

1. **Basic regression check:** re-run the same `adjustStock` calls from Step 3's verification list. Same inputs should give the same outputs — you haven't changed behavior for the non-concurrent case, only the concurrent one.
2. **Confirm events are being written:** after any `adjustStock` or `transferStock` call, run `{"action": "listInventoryEvents"}` and confirm a matching row shows up with the right `delta` and `reason`.
3. **Confirm `transferStock` moves stock, not copies it:** create a product with 20 units in Warehouse A, transfer 8 to Warehouse B, then `listInventory` — A should show 12, B should show 8, and total across both should still be 20.
4. **Prove atomicity on a failed transfer:** temporarily pass a `toWarehouseId` from a *different* organization (or a nonexistent id) to `transferStock` — it should 404 before touching anything, and A's quantity should be completely unchanged. Then, to prove the transaction rollback path specifically (not just the earlier ownership check), try transferring more than A has in stock — expect the 400 "Not enough stock" response, and confirm neither A nor B's quantity moved at all.
5. **Concurrency check (the actual point of this step):** write a tiny throwaway script that fires two `adjustStock` requests at the same item at nearly the same instant (e.g. `Promise.all([fetch(...), fetch(...)])` from a scratch Node script, each with a `delta` that would only be safe if applied one-at-a-time, like `-6` and `-6` against a starting quantity of `10`). Before this step, you could get both to "succeed" with a lost update. After this step, one should succeed and the other should come back with the below-zero `400` — because the second one's `FOR UPDATE` wait means it only proceeds after seeing the first one's write.

## Deliberately left out of Step 3b

- **Linking the two `InventoryEvent` rows from one `transferStock` call.** Right now they're two independent rows that happen to share a `productId` and near-identical `createdAt` — there's no `transferGroupId` connecting them. Fine for a simple activity feed; worth adding if you ever want to show "this transfer" as one grouped entry instead of two separate lines.
- **Reversing/undoing an event.** There's no `undoInventoryEvent` action — correcting a mistake today means manually running an opposite `adjustStock`, which itself creates a new event rather than erasing the old one. That's arguably the right audit-trail behavior (never delete history), but it's worth being a deliberate product decision later, not an oversight now.
- **Pagination on `listInventoryEvents`.** It's a flat `take: 20` with no cursor — fine for a dashboard's "recent activity" card, not fine once someone wants to page back through a month of history.
- **Suppliers, purchase orders, customers, sales orders.** Still Step 4, still untouched by anything in this doc.
