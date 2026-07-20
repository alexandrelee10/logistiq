# Step 4 — Suppliers & Purchase Orders

Companion to `docs/step-3-warehouse-inventory-actions.md`'s "deliberately left out" list, which named this as the next piece: *"Suppliers + Purchase Orders — new models, needed for 'Open purchase orders.'"* This doc tells you what to build and why, in order. You're writing the code — nothing here gets applied automatically.

**Scope of this step:** `Supplier`, `PurchaseOrder`, and `PurchaseOrderLine` — plus `createSupplier`, `listSuppliers`, `createPurchaseOrder`, `listPurchaseOrders`, `submitPurchaseOrder`, and `receivePurchaseOrder`. Customers, sales orders, and the revenue chart are **Step 5**, entirely separate models with no dependency on anything here.

## Why this step reuses Step 3b, not just Step 3

Receiving a purchase order is, at its core, exactly the same operation as `adjustStock`: increase a product's quantity in a specific warehouse, and leave a record of why. `receivePurchaseOrder` below calls the same `applyStockDelta` helper from `app/lib/inventory.ts` that `adjustStock` and `transferStock` already use — same row lock, same negative-floor protection, same transactional guarantee. This is the payoff of having pulled that logic into its own function back in Step 3b instead of leaving it embedded inside a single handler: a third, unrelated feature gets to reuse it for free.

The other reason this is its own step, not folded into Step 3: `PurchaseOrder` needs `PurchaseOrderLine` as a child table (a PO is never "one product, one quantity" — it's a list), and receiving needs to reconcile "how much was ordered" against "how much has arrived so far," across possibly multiple partial deliveries. That's real, new modeling, not just another registered action on existing tables.

## The new folder structure

```
logistiq/
├─ prisma/
│  └─ schema.prisma                    # ADD: Supplier, PurchaseOrder, PurchaseOrderLine
│                                       # EDIT: back-relations on Organization and Product
├─ app/
│  └─ modules/
│     └─ purchasing/
│        └─ purchasing.ts              # NEW: all six actions below
```

## Do it in this order

### 1. Add the three models to `prisma/schema.prisma`

```prisma
model Supplier {
  id             String @id @default(cuid())
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  name  String
  email String?
  phone String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  purchaseOrders PurchaseOrder[]
}

model PurchaseOrder {
  id             String @id @default(cuid())
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  supplierId String
  supplier   Supplier @relation(fields: [supplierId], references: [id])

  status String @default("draft") // draft | submitted | partially_received | received

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  lines PurchaseOrderLine[]
}

model PurchaseOrderLine {
  id String @id @default(cuid())

  purchaseOrderId String
  purchaseOrder   PurchaseOrder @relation(fields: [purchaseOrderId], references: [id], onDelete: Cascade)

  productId String
  product   Product @relation(fields: [productId], references: [id])

  quantityOrdered  Int
  quantityReceived Int @default(0)
  unitCost         Decimal? @db.Decimal(10, 2)
}
```

And the back-relations Prisma requires on the models being pointed at:

```prisma
model Organization {
  // ...existing fields...
  suppliers      Supplier[]
  purchaseOrders PurchaseOrder[]
}

model Product {
  // ...existing fields...
  purchaseOrderLines PurchaseOrderLine[]
}
```

A couple of choices worth understanding:

- **`status` is a plain string with an informal set of values, not a Prisma `enum`.** `USERROLE` is an enum because that set of roles is genuinely fixed and rarely changes. PO status is more likely to grow a value later (`"cancelled"`, `"awaiting_approval"`) as you learn what your workflow actually needs — a string keeps that a code change, not a migration.
- **`organizationId` lives directly on `PurchaseOrder`, not just inferred through `supplier.organizationId`.** Same reasoning as `Product` and `Warehouse` back in Step 2: every org-scoped query filters on `organizationId` directly, so it needs to be a real column on the table you're querying, not something you'd have to join through every time.
- **No human-readable "PO-2043"-style number.** The dashboard mock data shows numbers like that, but generating them safely (no gaps, no collisions across concurrent creates) is its own small problem, deliberately left out below — you'll refer to POs by their `id` for now.

Migrate:

```
npx prisma migrate dev --name add_purchasing
```

### 2. Write `createSupplier` and `listSuppliers`

Start `app/modules/purchasing/purchasing.ts`:

```ts
import { prisma } from "@/app/lib/prisma";
import { register } from "@/app/lib/registry";
import { applyStockDelta } from "@/app/lib/inventory";

register("createSupplier", async (data, ctx) => {
    const { name, email, phone } = data;

    if (!name) {
        return { status: 400, body: { error: "name is required." } };
    }

    const supplier = await prisma.supplier.create({
        data: { organizationId: ctx.organizationId, name, email: email ?? null, phone: phone ?? null },
    });
    return { status: 201, body: { supplier } };
});

register("listSuppliers", async (_data, ctx) => {
    const suppliers = await prisma.supplier.findMany({
        where: { organizationId: ctx.organizationId },
    });
    return { status: 200, body: { suppliers } };
});
```

Nothing new here — same shape as `createWarehouse`/`listWarehouse` from Step 3.

### 3. Write `createPurchaseOrder`

```ts
register("createPurchaseOrder", async (data, ctx) => {
    const { supplierId, lines } = data;

    if (!supplierId || !Array.isArray(lines) || lines.length === 0) {
        return { status: 400, body: { error: "supplierId and a non-empty lines array are required." } };
    }
    for (const line of lines) {
        if (!line.productId || typeof line.quantity !== "number" || line.quantity <= 0) {
            return {
                status: 400,
                body: { error: "Each line needs a productId and a positive numeric quantity." },
            };
        }
    }

    const supplier = await prisma.supplier.findFirst({
        where: { id: supplierId, organizationId: ctx.organizationId },
    });
    if (!supplier) {
        return { status: 404, body: { error: "Supplier not found." } };
    }

    const productIds = lines.map((l) => l.productId);
    const products = await prisma.product.findMany({
        where: { id: { in: productIds }, organizationId: ctx.organizationId },
    });
    if (products.length !== new Set(productIds).size) {
        return { status: 404, body: { error: "One or more products not found." } };
    }

    const purchaseOrder = await prisma.$transaction(async (tx) => {
        const po = await tx.purchaseOrder.create({
            data: { organizationId: ctx.organizationId, supplierId, status: "draft" },
        });

        await tx.purchaseOrderLine.createMany({
            data: lines.map((l) => ({
                purchaseOrderId: po.id,
                productId: l.productId,
                quantityOrdered: l.quantity,
                unitCost: l.unitCost ?? null,
            })),
        });

        return tx.purchaseOrder.findUniqueOrThrow({
            where: { id: po.id },
            include: { lines: true, supplier: true },
        });
    });

    return { status: 201, body: { purchaseOrder } };
});
```

`new Set(productIds).size` compared against `products.length` is a compact way to catch "you asked for a product that doesn't exist (or isn't yours)" — if you passed 3 unique product ids and only 2 came back from the org-scoped query, one of them was bad. Everything happens inside one `$transaction` because a `PurchaseOrder` with zero lines (if the `createMany` failed partway) isn't a valid state you ever want sitting in the database.

### 4. Write `listPurchaseOrders`

```ts
register("listPurchaseOrders", async (data, ctx) => {
    const { status } = data;

    const purchaseOrders = await prisma.purchaseOrder.findMany({
        where: {
            organizationId: ctx.organizationId,
            ...(status ? { status } : {}),
        },
        include: { supplier: true, lines: { include: { product: true } } },
        orderBy: { createdAt: "desc" },
    });

    return { status: 200, body: { purchaseOrders } };
});
```

### 5. Write `submitPurchaseOrder`

A small, deliberate state-machine guard — you can only submit a PO that's still a draft:

```ts
register("submitPurchaseOrder", async (data, ctx) => {
    const { purchaseOrderId } = data;

    const po = await prisma.purchaseOrder.findFirst({
        where: { id: purchaseOrderId, organizationId: ctx.organizationId },
    });
    if (!po) {
        return { status: 404, body: { error: "Purchase order not found." } };
    }
    if (po.status !== "draft") {
        return { status: 400, body: { error: `Cannot submit a purchase order with status "${po.status}".` } };
    }

    const purchaseOrder = await prisma.purchaseOrder.update({
        where: { id: purchaseOrderId },
        data: { status: "submitted" },
    });

    return { status: 200, body: { purchaseOrder } };
});
```

### 6. Write `receivePurchaseOrder` — the one that touches inventory

```ts
register("receivePurchaseOrder", async (data, ctx) => {
    const { purchaseOrderId, warehouseId, receipts } = data;

    if (!purchaseOrderId || !warehouseId || !Array.isArray(receipts) || receipts.length === 0) {
        return {
            status: 400,
            body: { error: "purchaseOrderId, warehouseId, and a non-empty receipts array are required." },
        };
    }

    const [po, warehouse] = await Promise.all([
        prisma.purchaseOrder.findFirst({
            where: { id: purchaseOrderId, organizationId: ctx.organizationId },
            include: { lines: true },
        }),
        prisma.warehouse.findFirst({ where: { id: warehouseId, organizationId: ctx.organizationId } }),
    ]);
    if (!po || !warehouse) {
        return { status: 404, body: { error: "Purchase order or warehouse not found." } };
    }
    if (po.status === "draft") {
        return { status: 400, body: { error: "Submit this purchase order before receiving it." } };
    }
    if (po.status === "received") {
        return { status: 400, body: { error: "This purchase order has already been fully received." } };
    }

    // Validate every receipt against its line *before* writing anything.
    const linesById = new Map(po.lines.map((l) => [l.id, l]));
    for (const r of receipts) {
        const line = linesById.get(r.lineId);
        if (!line) {
            return { status: 404, body: { error: `Line ${r.lineId} not found on this purchase order.` } };
        }
        const remaining = line.quantityOrdered - line.quantityReceived;
        if (typeof r.quantity !== "number" || r.quantity <= 0 || r.quantity > remaining) {
            return {
                status: 400,
                body: { error: `Line ${r.lineId} can accept at most ${remaining} more units.` },
            };
        }
    }

    const purchaseOrder = await prisma.$transaction(async (tx) => {
        for (const r of receipts) {
            const line = linesById.get(r.lineId)!;

            await applyStockDelta(tx, line.productId, warehouseId, r.quantity);
            await tx.inventoryEvent.create({
                data: {
                    productId: line.productId,
                    warehouseId,
                    delta: r.quantity,
                    reason: `purchase order ${purchaseOrderId} receipt`,
                    userId: ctx.userId,
                },
            });
            await tx.purchaseOrderLine.update({
                where: { id: r.lineId },
                data: { quantityReceived: { increment: r.quantity } },
            });
        }

        const updatedLines = await tx.purchaseOrderLine.findMany({ where: { purchaseOrderId } });
        const fullyReceived = updatedLines.every((l) => l.quantityReceived >= l.quantityOrdered);

        return tx.purchaseOrder.update({
            where: { id: purchaseOrderId },
            data: { status: fullyReceived ? "received" : "partially_received" },
            include: { lines: true, supplier: true },
        });
    });

    return { status: 200, body: { purchaseOrder } };
});
```

Worth understanding, not just copying:

- **Validation happens twice, on purpose, in two different ways.** The `for` loop before the transaction checks "does this request even make sense" (do these lines exist, is the quantity within what's left) and returns early with a clear 400/404 if not — no point opening a transaction for a request you already know is invalid. The `applyStockDelta` call inside the transaction still does its own row-locked check when it writes `InventoryItem` — that's the layer that protects against a *second, concurrent* `receivePurchaseOrder` (or `adjustStock`) racing against this one, which the earlier loop can't see coming.
- **One `receivePurchaseOrder` call always writes into a single `warehouseId`.** If a supplier's shipment actually needs to land across two different warehouses, that's two separate calls — this action doesn't support splitting one line's receipt across warehouses in one request. Simpler contract, and matches how a receiving dock generally works: one truck, one location.
- **Status is recomputed from the actual line data (`updatedLines.every(...)`), not incremented/assumed.** This is what makes multiple partial receipts over time correct: call this three times with small `receipts` arrays, and the third call is the one that flips status to `"received"` — because that's the first time `.every(...)` actually comes back true, not because you counted calls.

## How to verify it actually worked

1. `{"action": "createSupplier", "name": "Acme Packaging"}` — expect `201` with the supplier.
2. `{"action": "createPurchaseOrder", "supplierId": "<id>", "lines": [{"productId": "<id>", "quantity": 50}]}` — expect `201`, `status: "draft"`, one line with `quantityReceived: 0`.
3. Try `receivePurchaseOrder` on that draft PO — expect `400`, "Submit this purchase order before receiving it."
4. `{"action": "submitPurchaseOrder", "purchaseOrderId": "<id>"}` — expect `status: "submitted"`.
5. `{"action": "receivePurchaseOrder", "purchaseOrderId": "<id>", "warehouseId": "<id>", "receipts": [{"lineId": "<line id>", "quantity": 20}]}` — expect `200`, `status: "partially_received"`, that line's `quantityReceived: 20`. Then `listInventory` for that product/warehouse — expect quantity increased by 20, and `listInventoryEvents` — expect a new event with the `"purchase order ... receipt"` reason.
6. Receive the remaining 30 in a second call — expect `status: "received"` this time.
7. Try receiving again (any quantity) — expect `400`, "already been fully received."
8. Try receiving more than remains on a line partway through (e.g. ask for 40 when only 30 is left) — expect `400` naming the actual remaining amount, and confirm via `listInventory`/`listInventoryEvents` that nothing was written.

## Deliberately left out of Step 4

- **Human-readable PO numbers** (`"PO-2043"`). Needs a per-organization counter that's itself race-safe to generate — a small version of the exact problem Step 3b solved for stock, applied to a new column. Worth adding once the dashboard actually needs to display something friendlier than a `cuid`.
- **Cancelling a purchase order.** There's no `cancelPurchaseOrder` action — right now a draft PO you no longer want just sits there forever. Straightforward to add (a status guard similar to `submitPurchaseOrder`'s), just not required for the receiving flow to work correctly.
- **Editing line items after creation.** Ordered the wrong quantity on a draft PO? Right now there's no `updatePurchaseOrderLine` — you'd cancel (once that exists) and recreate.
- **Wiring the dashboard's "Open purchase orders" card to `listPurchaseOrders`.** That's a frontend pass against real data instead of the `OPEN_PURCHASE_ORDERS` mock array — not part of this step.
- **Customers, sales orders, and the revenue chart.** Step 5.
