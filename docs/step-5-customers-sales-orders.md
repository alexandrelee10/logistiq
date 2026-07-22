# Step 5 — Customers & Sales Orders

Companion to `docs/step-4-suppliers-purchase-orders.md` — same shape, mirrored to the revenue side. This doc tells you what to build and why, in order. You're writing the code — nothing here gets applied automatically.

**Scope of this step:** `Customer`, `SalesOrder`, `SalesOrderLine` — plus `createCustomer`, `listCustomers`, `createSalesOrder`, `listSalesOrders`, `confirmSalesOrder`, `fulfillSalesOrder`, and `recordPayment`. This is the last domain the dashboard's mock data depends on — once this works, "Top customers," "Unpaid sales orders," and the revenue chart all have real data to query against (wiring the dashboard itself is still a separate, later pass).

## Why this is basically Step 4, mirrored

A sales order and a purchase order are the same shape pointed in opposite directions: one increases your stock and owes money to a supplier, the other decreases your stock and is owed money by a customer. `Supplier` → `Customer`. `PurchaseOrder`/`PurchaseOrderLine` → `SalesOrder`/`SalesOrderLine`. `receivePurchaseOrder` (adds stock in) → `fulfillSalesOrder` (takes stock out) — and both call the exact same `applyStockDelta` helper from `app/lib/inventory.ts`, just with the sign flipped. If Step 4 made sense, most of this should feel familiar rather than new — the interesting new part is `recordPayment`, since purchase orders never needed a "how much have we paid the supplier" number.

## One deliberate difference from Step 4: no enum this time

Step 4's `PurchaseOrderStatus` enum caused real friction — new statuses meant a schema change and a migration every time, and it was easy for a handler to end up checking a value the enum didn't even have yet. `SalesOrder.status` here is a plain `String` with an informal set of values, same as `Trip.status` in the very first reference guide. If you need a new status later (`"on_hold"`, whatever), that's a code change, not a migration. This isn't a rule that plain strings are always better than enums — it's a direct lesson from what just happened.

## The new folder structure

```
logistiq/
├─ prisma/
│  └─ schema.prisma                    # ADD: Customer, SalesOrder, SalesOrderLine
│                                       # EDIT: back-relations on Organization and Product
├─ app/
│  └─ modules/
│     └─ sales/
│        └─ sales.ts                   # NEW: all seven actions below
```

## Do it in this order

### 1. Add the three models to `prisma/schema.prisma`

```prisma
model Customer {
  id             String @id @default(cuid())
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  name  String
  email String?
  phone String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  salesOrders SalesOrder[]
}

model SalesOrder {
  id             String @id @default(cuid())
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  customerId String
  customer   Customer @relation(fields: [customerId], references: [id])

  status     String    @default("draft") // draft | confirmed | partially_fulfilled | fulfilled | cancelled
  dueDate    DateTime?
  amountPaid Decimal   @default(0) @db.Decimal(10, 2)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  lines SalesOrderLine[]
}

model SalesOrderLine {
  id String @id @default(cuid())

  salesOrderId String
  salesOrder   SalesOrder @relation(fields: [salesOrderId], references: [id], onDelete: Cascade)

  productId String
  product   Product @relation(fields: [productId], references: [id])

  quantityOrdered   Int
  quantityFulfilled Int @default(0)
  unitPrice         Decimal @db.Decimal(10, 2)
}
```

Back-relations:

```prisma
model Organization {
  // ...existing fields...
  customers   Customer[]
  salesOrders SalesOrder[]
}

model Product {
  // ...existing fields...
  salesOrderLines SalesOrderLine[]
}
```

Notice there's no `amountTotal` column anywhere. That's on purpose — it's always exactly `sum(quantityOrdered × unitPrice)` across the lines, and a value that's fully derivable from other columns shouldn't also be stored, because storage and reality can drift the moment someone updates a line and forgets to update the total. `listSalesOrders` below computes it fresh every time instead.

Migrate:

```
npx prisma migrate dev --name add_sales
```

### 2. Write `createCustomer` and `listCustomers`

Start `app/modules/sales/sales.ts`:

```ts
import { prisma } from "@/app/lib/prisma";
import { register } from "@/app/lib/registry";
import { applyStockDelta, StockBelowZeroError } from "@/app/lib/inventory";
import { Prisma } from "@/generated/prisma/client";

register("createCustomer", async (data, ctx) => {
    const { name, email, phone } = data;

    if (!name) {
        return { status: 400, body: { error: "name is required." } };
    }

    const customer = await prisma.customer.create({
        data: { organizationId: ctx.organizationId, name, email: email ?? null, phone: phone ?? null },
    });
    return { status: 201, body: { customer } };
});

register("listCustomers", async (_data, ctx) => {
    const customers = await prisma.customer.findMany({
        where: { organizationId: ctx.organizationId },
    });
    return { status: 200, body: { customers } };
});
```

Same shape as `createSupplier`/`listSuppliers` — nothing new.

### 3. Write `createSalesOrder`

```ts
type SalesOrderLineInput = { productId: string; quantity: number; unitPrice: number };

register("createSalesOrder", async (data, ctx) => {
    const { customerId, lines, dueDate } = data as {
        customerId: string;
        lines: SalesOrderLineInput[];
        dueDate?: string;
    };

    if (!customerId || !Array.isArray(lines) || lines.length === 0) {
        return { status: 400, body: { error: "customerId and a non-empty lines array are required." } };
    }
    for (const line of lines) {
        if (
            !line.productId ||
            typeof line.quantity !== "number" ||
            line.quantity <= 0 ||
            typeof line.unitPrice !== "number" ||
            line.unitPrice < 0
        ) {
            return {
                status: 400,
                body: { error: "Each line needs a productId, a positive quantity, and a non-negative unitPrice." },
            };
        }
    }

    const customer = await prisma.customer.findFirst({
        where: { id: customerId, organizationId: ctx.organizationId },
    });
    if (!customer) {
        return { status: 404, body: { error: "Customer not found." } };
    }

    const productIds = lines.map((l) => l.productId);
    const products = await prisma.product.findMany({
        where: { id: { in: productIds }, organizationId: ctx.organizationId },
    });
    if (products.length !== new Set(productIds).size) {
        return { status: 404, body: { error: "One or more products not found." } };
    }

    const salesOrder = await prisma.$transaction(async (tx) => {
        const so = await tx.salesOrder.create({
            data: {
                organizationId: ctx.organizationId,
                customerId,
                status: "draft",
                dueDate: dueDate ? new Date(dueDate) : null,
            },
        });

        await tx.salesOrderLine.createMany({
            data: lines.map((l) => ({
                salesOrderId: so.id,
                productId: l.productId,
                quantityOrdered: l.quantity,
                unitPrice: l.unitPrice,
            })),
        });

        return tx.salesOrder.findUniqueOrThrow({
            where: { id: so.id },
            include: { lines: true, customer: true },
        });
    });

    return { status: 201, body: { salesOrder } };
});
```

This deliberately does **not** check inventory availability at creation time — a sales order is a commitment to sell, not a stock reservation. Whether there's enough stock is checked later, at `fulfillSalesOrder` time, the same way `createPurchaseOrder` doesn't touch inventory either. Keeping "record the order" and "move the stock" as separate steps is what makes drafts, cancellations, and back-orders possible without inventory getting touched prematurely.

### 4. Write `listSalesOrders` — with computed totals

This is the one place Decimal arithmetic actually matters, so it's worth slowing down on. `unitPrice` and `amountPaid` come back from Prisma as `Decimal` objects (from the `decimal.js` library Prisma uses under the hood), **not plain JavaScript numbers** — `line.unitPrice * line.quantityOrdered` will not do what you want, because `*` isn't defined for that class the way you'd expect. Use the `Decimal`'s own arithmetic methods (`.times()`, `.plus()`) and only convert to a plain number at the very end, for the response:

```ts
register("listSalesOrders", async (data, ctx) => {
    const { status, unpaidOnly } = data;

    const salesOrders = await prisma.salesOrder.findMany({
        where: {
            organizationId: ctx.organizationId,
            ...(status ? { status } : {}),
        },
        include: { customer: true, lines: { include: { product: true } } },
        orderBy: { createdAt: "desc" },
    });

    const withTotals = salesOrders.map((so) => {
        const amountTotal = so.lines.reduce(
            (sum, l) => sum.plus(l.unitPrice.times(l.quantityOrdered)),
            new Prisma.Decimal(0)
        );
        const balanceDue = amountTotal.minus(so.amountPaid);

        return {
            ...so,
            amountTotal: amountTotal.toNumber(),
            balanceDue: balanceDue.toNumber(),
        };
    });

    const result = unpaidOnly ? withTotals.filter((so) => so.balanceDue > 0) : withTotals;

    return { status: 200, body: { salesOrders: result } };
});
```

`unpaidOnly: true` is exactly what the dashboard's "Unpaid sales orders" card needs to filter on — no separate action required, just a flag on this one.

### 5. Write `confirmSalesOrder`

Same shape as `submitPurchaseOrder`:

```ts
register("confirmSalesOrder", async (data, ctx) => {
    const { salesOrderId } = data;

    const so = await prisma.salesOrder.findFirst({
        where: { id: salesOrderId, organizationId: ctx.organizationId },
    });
    if (!so) {
        return { status: 404, body: { error: "Sales order not found." } };
    }
    if (so.status !== "draft") {
        return { status: 400, body: { error: `Cannot confirm a sales order with status "${so.status}".` } };
    }

    const salesOrder = await prisma.salesOrder.update({
        where: { id: salesOrderId },
        data: { status: "confirmed" },
    });

    return { status: 200, body: { salesOrder } };
});
```

### 6. Write `fulfillSalesOrder`

The mirror image of `receivePurchaseOrder` — same structure, opposite sign on the stock change:

```ts
register("fulfillSalesOrder", async (data, ctx) => {
    const { salesOrderId, warehouseId, fulfillments } = data;

    if (!salesOrderId || !warehouseId || !Array.isArray(fulfillments) || fulfillments.length === 0) {
        return {
            status: 400,
            body: { error: "salesOrderId, warehouseId, and a non-empty fulfillments array are required." },
        };
    }

    const [so, warehouse] = await Promise.all([
        prisma.salesOrder.findFirst({
            where: { id: salesOrderId, organizationId: ctx.organizationId },
            include: { lines: true },
        }),
        prisma.warehouse.findFirst({ where: { id: warehouseId, organizationId: ctx.organizationId } }),
    ]);
    if (!so || !warehouse) {
        return { status: 404, body: { error: "Sales order or warehouse not found." } };
    }
    if (so.status === "draft") {
        return { status: 400, body: { error: "Confirm this sales order before fulfilling it." } };
    }
    if (so.status === "cancelled") {
        return { status: 400, body: { error: "This sales order has been cancelled." } };
    }
    if (so.status === "fulfilled") {
        return { status: 400, body: { error: "This sales order has already been fully fulfilled." } };
    }

    const linesById = new Map(so.lines.map((l) => [l.id, l]));
    for (const f of fulfillments) {
        const line = linesById.get(f.lineId);
        if (!line) {
            return { status: 404, body: { error: `Line ${f.lineId} not found on this sales order.` } };
        }
        const remaining = line.quantityOrdered - line.quantityFulfilled;
        if (typeof f.quantity !== "number" || f.quantity <= 0 || f.quantity > remaining) {
            return {
                status: 400,
                body: { error: `Line ${f.lineId} can fulfill at most ${remaining} more units.` },
            };
        }
    }

    try {
        const salesOrder = await prisma.$transaction(async (tx) => {
            for (const f of fulfillments) {
                const line = linesById.get(f.lineId)!;

                // Negative delta — this is the one line that actually differs from receivePurchaseOrder.
                await applyStockDelta(tx, line.productId, warehouseId, -f.quantity);
                await tx.inventoryRecord.create({
                    data: {
                        productId: line.productId,
                        warehouseId,
                        delta: -f.quantity,
                        reason: `sales order ${salesOrderId} fulfillment`,
                        userId: ctx.userId,
                    },
                });
                await tx.salesOrderLine.update({
                    where: { id: f.lineId },
                    data: { quantityFulfilled: { increment: f.quantity } },
                });
            }

            const updatedLines = await tx.salesOrderLine.findMany({ where: { salesOrderId } });
            const fullyFulfilled = updatedLines.every((l) => l.quantityFulfilled >= l.quantityOrdered);

            return tx.salesOrder.update({
                where: { id: salesOrderId },
                data: { status: fullyFulfilled ? "fulfilled" : "partially_fulfilled" },
                include: { lines: true, customer: true },
            });
        });

        return { status: 200, body: { salesOrder } };
    } catch (err) {
        if (err instanceof StockBelowZeroError) {
            return { status: 400, body: { error: "Not enough stock to fulfill this order." } };
        }
        throw err;
    }
});
```

This is exactly why `applyStockDelta` throwing `StockBelowZeroError` (from Step 3b) instead of just returning an error object matters here: it's the thing that makes an over-committed sales order (promised more than you actually have on the shelf) fail loudly and roll back cleanly, instead of quietly taking your stock negative.

### 7. Write `recordPayment`

```ts
register("recordPayment", async (data, ctx) => {
    const { salesOrderId, amount } = data;

    if (!salesOrderId || typeof amount !== "number" || amount <= 0) {
        return { status: 400, body: { error: "salesOrderId and a positive numeric amount are required." } };
    }

    const so = await prisma.salesOrder.findFirst({
        where: { id: salesOrderId, organizationId: ctx.organizationId },
        include: { lines: true },
    });
    if (!so) {
        return { status: 404, body: { error: "Sales order not found." } };
    }

    const amountTotal = so.lines.reduce(
        (sum, l) => sum.plus(l.unitPrice.times(l.quantityOrdered)),
        new Prisma.Decimal(0)
    );
    const newAmountPaid = so.amountPaid.plus(amount);

    if (newAmountPaid.greaterThan(amountTotal)) {
        return {
            status: 400,
            body: { error: `That payment would overpay this order by ${newAmountPaid.minus(amountTotal).toFixed(2)}.` },
        };
    }

    const salesOrder = await prisma.salesOrder.update({
        where: { id: salesOrderId },
        data: { amountPaid: newAmountPaid },
    });

    return { status: 200, body: { salesOrder } };
});
```

`recordPayment` is deliberately independent of `status` — you can pay against a `"draft"` order (a deposit before you've even shipped anything) just as easily as a `"fulfilled"` one. Mixing "has this been paid" into the same status field as "has this been shipped" would force every order into needing both dimensions crammed into one string; keeping `amountPaid` as its own number sidesteps that entirely.

## How to verify it actually worked

1. `createCustomer`, then `createSalesOrder` with one line — expect `201`, `status: "draft"`.
2. `listSalesOrders` — confirm `amountTotal` matches `quantity × unitPrice` by hand, and `balanceDue` equals `amountTotal` (nothing paid yet).
3. Try `fulfillSalesOrder` on the still-draft order — expect `400`, "Confirm this sales order before fulfilling it."
4. `confirmSalesOrder`, then `fulfillSalesOrder` for a quantity larger than what's actually in the warehouse (adjust stock down first if needed, or just order more than you've ever stocked) — expect `400`, "Not enough stock to fulfill this order," and confirm via `listInventory` that stock didn't move at all.
5. `fulfillSalesOrder` for a valid, in-stock quantity — expect `200`, `status: "fulfilled"` (or `"partially_fulfilled"` if you only fulfilled part of it), and confirm via `listInventory`/`listInventoryEvents` that stock actually decreased and a `-N` record was logged.
6. `recordPayment` for less than the full `amountTotal` — expect `200`, then `listSalesOrders` with `unpaidOnly: true` — the order should still show up, with a `balanceDue` greater than zero.
7. `recordPayment` for the remaining balance — expect `200`, then `listSalesOrders` with `unpaidOnly: true` — the order should now be gone from the list.
8. Try `recordPayment` for more than the remaining balance — expect `400`, the overpayment error.

## Deliberately left out of Step 5

- **A `Payment` audit log model.** `amountPaid` is just a running total, the same way `InventoryItem.quantity` was before Step 3b added `InventoryRecord` — there's no row anywhere saying "this specific $500 payment happened on this date, here's why." Same fix as before would apply here if you need it: a `Payment` model, written inside `recordPayment`'s transaction.
- **`topCustomers` / revenue-chart aggregation.** These are read-only reporting queries over data that now actually exists (`listSalesOrders` plus a `groupBy customerId` or `groupBy` on date), not new write-path logic — a natural, smaller follow-up once this step is verified, closer to a "reports" pass than a "step."
- **Cancelling a sales order, editing lines after creation.** Same gaps as Step 4 had for purchase orders, same reasoning for leaving them out for now.
- **Wiring the dashboard's "Top customers," "Unpaid sales orders," and revenue chart to real data.** That's a frontend pass against `listSalesOrders`/`listCustomers` instead of the `TOP_CUSTOMERS`/`UNPAID_ORDERS`/`REVENUE_BARS` mock arrays — not part of this step, and the last piece standing between the dashboard and being fully real.
