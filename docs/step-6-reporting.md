# Step 6 — Reporting: Top Customers & Revenue by Day

Companion to `docs/step-5-customers-sales-orders.md`'s "deliberately left out" section: *"topCustomers / revenue-chart aggregation... a natural, smaller follow-up once this step is verified, closer to a 'reports' pass than a 'step.'"* This doc tells you what to build and why, in order. You're writing the code — nothing here gets applied automatically.

**Scope of this step:** two read-only actions — `topCustomers` and `revenueByDay` — that query data you already have (from Step 5) and shape it the way the dashboard's remaining mock cards need it. No new models, no new writes, no schema changes. Actually wiring `app/dashboard/page.tsx` to call these instead of its `TOP_CUSTOMERS`/`REVENUE_BARS` mock arrays is **Step 7** — a frontend pass, not part of this doc.

## Why this is a "reports" step, not a features step

Everything through Step 5 has been about *writing* data safely — locks, transactions, status transitions. This step is the opposite kind of problem: the data already exists and is already correct; the only job here is *reading it back in a different shape*. `topCustomers` needs "revenue per customer, ranked" instead of "orders per customer." `revenueByDay` needs "revenue per calendar day" instead of "revenue per order." Neither of those shapes exist yet, but both are fully derivable from `SalesOrder` + `SalesOrderLine`, the same way `amountTotal` in `listSalesOrders` was derivable rather than stored.

One deliberate rule both actions follow: only orders with status `"confirmed"`, `"partially_fulfilled"`, or `"fulfilled"` count toward revenue — `"draft"` orders are excluded (nothing's actually been committed to yet) and so is `"cancelled"` (it explicitly didn't happen). A draft order inflating your revenue numbers would be a real, business-meaningful bug, not just a cosmetic one.

## The new folder structure

```
logistiq/
└─ app/
   └─ modules/
      └─ reports/
         └─ reports.ts              # NEW: topCustomers, revenueByDay
```

## Do it in this order

### 1. Write `topCustomers`

```ts
import { prisma } from "@/app/lib/prisma";
import { register } from "@/app/lib/registry";
import { Prisma } from "@/generated/prisma/client";

const REVENUE_STATUSES = ["confirmed", "partially_fulfilled", "fulfilled"];

register("topCustomers", async (data, ctx) => {
    const { limit } = data;
    const take = typeof limit === "number" && limit > 0 ? limit : 5;

    const customers = await prisma.customer.findMany({
        where: { organizationId: ctx.organizationId },
        include: {
            salesOrders: {
                where: { status: { in: REVENUE_STATUSES } },
                include: { salesOrderLines: true },
            },
        },
    });

    const ranked = customers
        .map((c) => {
            const totalRevenue = c.salesOrders.reduce((customerSum, so) => {
                const orderTotal = so.salesOrderLines.reduce(
                    (sum, l) => sum.plus(l.unitPrice.times(l.quantityOrdered)),
                    new Prisma.Decimal(0)
                );
                return customerSum.plus(orderTotal);
            }, new Prisma.Decimal(0));

            const { salesOrders, ...customer } = c;
            return { ...customer, totalRevenue: totalRevenue.toNumber() };
        })
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, take);

    return { status: 200, body: { customers: ranked } };
});
```

Worth understanding, not just copying:

- **`REVENUE_STATUSES` is a named constant, not repeated inline.** `revenueByDay` below needs the exact same list — pulling it out once means the definition of "counts as revenue" lives in one place, and changing it later (say, deciding `"partially_fulfilled"` shouldn't count) is a one-line change instead of a find-and-replace across two functions.
- **The nested `salesOrders`/`salesOrderLines` data gets fetched, used to compute `totalRevenue`, then thrown away** (`const { salesOrders, ...customer } = c`) before the response goes out. You needed that data to do the math, but a "top customers" list doesn't need to hand the client every order behind each number.
- **Sorting and slicing happen in JavaScript, after the query, not in Prisma.** Same reasoning as `lowStock` back in Step 3 — ranking by a value that only exists after you've summed across a relation isn't something a single Prisma `orderBy` can express. For a handful of customers this is fine; see "deliberately left out" for what changes at scale.

### 2. Write `revenueByDay`

```ts
register("revenueByDay", async (data, ctx) => {
    const { days } = data;
    const windowDays = typeof days === "number" && days > 0 ? days : 30;

    const since = new Date();
    since.setDate(since.getDate() - (windowDays - 1));
    since.setHours(0, 0, 0, 0);

    const salesOrders = await prisma.salesOrder.findMany({
        where: {
            organizationId: ctx.organizationId,
            status: { in: REVENUE_STATUSES },
            createdAt: { gte: since },
        },
        include: { salesOrderLines: true },
    });

    // Seed every day in the window at zero first, so a day with no orders
    // still shows up as $0 in the response — not a gap the chart has to
    // guess how to fill.
    const totalsByDay = new Map<string, Prisma.Decimal>();
    for (let i = 0; i < windowDays; i++) {
        const d = new Date(since);
        d.setDate(d.getDate() + i);
        totalsByDay.set(d.toISOString().slice(0, 10), new Prisma.Decimal(0));
    }

    for (const so of salesOrders) {
        const day = so.createdAt.toISOString().slice(0, 10);
        const orderTotal = so.salesOrderLines.reduce(
            (sum, l) => sum.plus(l.unitPrice.times(l.quantityOrdered)),
            new Prisma.Decimal(0)
        );
        const existing = totalsByDay.get(day) ?? new Prisma.Decimal(0);
        totalsByDay.set(day, existing.plus(orderTotal));
    }

    const series = Array.from(totalsByDay.entries()).map(([date, total]) => ({
        date,
        total: total.toNumber(),
    }));

    return { status: 200, body: { series } };
});
```

`series` comes back sorted chronologically (oldest to newest) because `Map` preserves insertion order in JavaScript, and days were inserted in order in the seeding loop — no separate sort needed. Each entry is `{ date: "2026-07-01", total: 182.5 }`, which is exactly the shape a chart needs: one x-axis value, one y-axis value, no gaps.

One simplification worth naming: revenue is attributed to the day an order was **created** (`createdAt`), not the day it was fulfilled or paid. For a dashboard chart, that's a reasonable and common choice — but it does mean a big order placed today and fulfilled next month shows up as today's revenue, not next month's. Real revenue-recognition rules (recognize revenue on fulfillment, or on payment) are a deliberate business decision, not a default to reach for without thinking about it — left out here on purpose.

### 3. Wire both into `app/modules/index.ts`

```ts
import "./reports/reports";
```

## How to verify it actually worked

1. With the customers/orders you already created in Step 5 testing, call `{"action": "topCustomers"}` — confirm the customer with the highest total across their confirmed/fulfilled orders is first, and that any customer whose only order is still `"draft"` shows `totalRevenue: 0` (or doesn't outrank someone with a real confirmed order).
2. Cancel one order (if you've built a cancel action) or just eyeball a `"draft"` one — confirm its value is excluded from the customer's `totalRevenue`.
3. Call `{"action": "revenueByDay"}` with no `days` — confirm you get back exactly 30 entries, chronologically ordered, and that today's entry includes whatever confirmed/fulfilled orders you created today.
4. Call it again with `{"days": 7}` — confirm exactly 7 entries.
5. Sum every `total` in the `revenueByDay` response by hand and compare it to the sum of every customer's `totalRevenue` from `topCustomers` (assuming the same time window and the same org) — they should roughly agree, which is a decent sanity check that both are computing "revenue" the same way.

## Deliberately left out of Step 6

- **Performance at scale.** Both actions load every customer/order for the organization into memory and compute totals in JavaScript. Fine at the size you're at now; the real fix once this organization has thousands of orders is pushing the sum into SQL (`groupBy` with `_sum`, or a raw aggregate query) instead of fetching every row. Worth revisiting when `topCustomers` starts feeling slow, not before.
- **Revenue attribution by fulfillment or payment date instead of order-creation date.** Noted above — a real product decision, not a default.
- **Caching.** These queries re-run in full on every call. A dashboard that's opened constantly might eventually want these cached for a few minutes rather than recomputed every page load — not needed until that's an observed problem.
- **Wiring `app/dashboard/page.tsx` to call these instead of its mock arrays.** That's Step 7 — the last piece, and purely a frontend change at this point, since every backend action the dashboard needs now exists.
