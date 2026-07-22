# Step 7 — Wire the Dashboard to Real Data

Companion to `docs/step-6-reporting.md`'s closing line: *"the last piece, and purely a frontend change at this point, since every backend action the dashboard needs now exists."* This doc tells you what to build and why, in order. You're writing the code — nothing here gets applied automatically.

**Scope of this step:** replace every mock array at the top of `app/dashboard/page.tsx` with real data from the actions you've already built across Steps 3–6, plus one small new action (`topProducts`) to close the one gap nothing has covered yet. No new schema, no new tables.

## The one architectural decision this step hinges on

`app/dashboard/page.tsx` is a Next.js **Server Component** — it already runs on the server and already talks to Prisma directly (look at its existing `prisma.user.findUnique(...)` call for the greeting). That means it should **not** call `fetch("/api/requests", ...)` the way `client/src/api/client.ts`-style frontend code would — that'd be the server making an HTTP request to itself over the network, for data it could just ask for directly, in-process.

Instead, import `orchestrate` (the same dispatcher `route.ts` uses) directly into the page, and call it like a regular function:

```ts
import { orchestrate } from "@/app/lib/orchestrate";
import { getCurrentUser } from "@/app/lib/auth";

const user = await getCurrentUser();
if (!user) redirect("/sign-in");

const ctx = { userId: user.id, organizationId: user.organizationId };
const lowStockResult = await orchestrate({ action: "lowStock" }, ctx);
```

Same registry, same handlers, same `{ status, body }` shape you've been testing in Postman this whole time — just invoked directly instead of over HTTP. This is exactly why the dispatcher pattern from Step 3 was worth building: the same action works identically whether it's called from Postman, or from a page that happens to run on the server.

## The mapping, card by card

| Dashboard card | Action to call | Notes |
|---|---|---|
| Products to reorder | `lowStock` | The mock's "to purchase" vs. "to transfer" split has no real backend concept behind it — nothing currently detects "another warehouse has spare stock." Treat every low-stock item as "to purchase" for now (see "left out" below). |
| Open purchase orders | `listPurchaseOrders` | Filter out `status: "received"` client-side (or pass a status filter) — "Open" means not yet fully received. No human-readable `"PO-2043"`-style number exists yet (Step 4 deliberately left that out) — display a shortened `id` instead. |
| Top 3 products | `topProducts` (new — see step 1 below) | Doesn't exist yet. Ranked by units sold, not revenue. |
| Top 3 customers | `topCustomers` | The mock's `sub` field ("Wholesale account") has no backing data — drop it, or replace with something real like order count. |
| Total sales revenue chart | `revenueByDay` | Bar heights need normalizing to a 0–100 scale for the UI (see step 4). |
| Unpaid sales orders | `listSalesOrders` with `unpaidOnly: true` | Already shaped almost exactly right — `balanceDue` maps straight to the mock's `balance`. |
| Recent inventory activity | `listInventoryEvents` | The mock's "Low Stock"/"Restocked"/"In Stock" status label isn't something a single event carries — derive a simpler label from `delta`'s sign and `reason` instead (see step 5). |

## Do it in this order

### 1. Add `topProducts` to `app/modules/reports/reports.ts`

The one card nothing built yet — ranked by units sold across confirmed/fulfilled sales orders, same shape as `topCustomers`:

```ts
register("topProducts", async (data, ctx) => {
    const { limit } = data;
    const take = typeof limit === "number" && limit > 0 ? limit : 5;

    const products = await prisma.product.findMany({
        where: { organizationId: ctx.organizationId },
        include: {
            salesOrderLines: {
                where: { salesOrder: { status: { in: REVENUE_STATUSES } } },
            },
        },
    });

    const ranked = products
        .map((p) => {
            const unitsSold = p.salesOrderLines.reduce((sum, l) => sum + l.quantityOrdered, 0);
            const { salesOrderLines, ...product } = p;
            return { ...product, unitsSold };
        })
        .sort((a, b) => b.unitsSold - a.unitsSold)
        .slice(0, take);

    return { status: 200, body: { products: ranked } };
});
```

Reuses the `REVENUE_STATUSES` constant already sitting at the top of `reports.ts` from Step 6 — same "only counts if it was actually committed to" rule as `topCustomers`/`revenueByDay`.

### 2. Add two small formatting helpers

Two things every card needs that don't belong inside any single card's code — put these near the top of `page.tsx`, or in a small `app/lib/format.ts` if you'd rather keep the page file shorter:

```ts
function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

function formatRelativeTime(date: Date): string {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}
```

### 3. Replace the data-fetching section of `DashboardPage`

Everything under `// --- Mock data ---` gets deleted. In its place, inside `DashboardPage`, fetch everything the page needs in parallel — there's no reason to wait for `lowStock` to finish before starting `topCustomers`, they don't depend on each other:

```ts
export default async function DashboardPage() {
    const user = await getCurrentUser();
    if (!user) redirect("/sign-in");

    const ctx = { userId: user.id, organizationId: user.organizationId };

    const [lowStockRes, purchaseOrdersRes, topProductsRes, topCustomersRes, revenueRes, unpaidRes, activityRes] =
        await Promise.all([
            orchestrate({ action: "lowStock" }, ctx),
            orchestrate({ action: "listPurchaseOrders" }, ctx),
            orchestrate({ action: "topProducts", limit: 3 }, ctx),
            orchestrate({ action: "topCustomers", limit: 3 }, ctx),
            orchestrate({ action: "revenueByDay", days: 30 }, ctx),
            orchestrate({ action: "listSalesOrders", unpaidOnly: true }, ctx),
            orchestrate({ action: "listInventoryEvents", limit: 5 }, ctx),
        ]);

    const reorderItems = lowStockRes.body.products;
    const openPurchaseOrders = purchaseOrdersRes.body.purchaseOrders.filter((po) => po.status !== "received");
    const topProducts = topProductsRes.body.products;
    const topCustomers = topCustomersRes.body.customers;
    const revenueSeries = revenueRes.body.series;
    const unpaidOrders = unpaidRes.body.salesOrders;
    const activity = activityRes.body.events;

    // ...the rest of the component (greeting, JSX) follows below, same as before
}
```

Calling `orchestrate` seven times here instead of writing seven direct Prisma queries might look like more work, but it means the dashboard's numbers are guaranteed to match whatever Postman shows you when you call the same actions — one source of truth for "what does low stock mean," not two implementations that can quietly drift apart.

### 4. Map each result onto the existing JSX

Most of the JSX in `page.tsx` doesn't need to change shape-for-shape — it needs the field names lined up. A few spots need actual transformation, not just renaming:

**Revenue chart bars** — the mock's `REVENUE_BARS` were arbitrary 0–100 percentages for bar height; `revenueSeries` gives real dollar totals per day, which need normalizing to that same 0–100 scale to render as bars of the right relative height:

```ts
const maxRevenue = Math.max(...revenueSeries.map((d) => d.total), 1); // avoid divide-by-zero on an empty series
const revenueBarHeights = revenueSeries.map((d) => (d.total / maxRevenue) * 100);
const totalRevenue = revenueSeries.reduce((sum, d) => sum + d.total, 0);
```

`totalRevenue`, formatted with `formatCurrency`, replaces the hardcoded `"$182,400"` in that card's `CardHeader`.

**Purchase order status labels** — real statuses are lowercase (`"draft"`, `"submitted"`, `"partially_received"`) but `PO_STATUS_STYLES` is keyed on capitalized display strings (`"Draft"`, `"Submitted"`, `"Partially Received"`). Either add a small `STATUS_LABELS` lookup object mapping one to the other, or change `PO_STATUS_STYLES`'s keys to match the real lowercase values directly — simpler, and one less mapping to keep in sync.

**Activity status label** — instead of a stored `"Low Stock"`/`"Restocked"`/`"In Stock"` value, derive something simpler directly from the event:

```ts
function activityLabel(delta: number): string {
    return delta > 0 ? "Restocked" : "Adjusted";
}
```

**Purchase order number** — no `"PO-2043"` exists yet. Use `` `PO-${po.id.slice(-6).toUpperCase()}` `` as a placeholder that at least looks order-number-shaped, and revisit properly once Step 4's "left out" human-readable numbering gets built.

### 5. Delete the entire `// --- Mock data ---` block

Once every card above is reading from a real variable, the `REORDER_ITEMS`, `OPEN_PURCHASE_ORDERS`, `TOP_PRODUCTS`, `TOP_CUSTOMERS`, `REVENUE_BARS`, `UNPAID_ORDERS`, and `ACTIVITY` constants at the top of the file are dead code — delete the whole block, not just the ones you've replaced, so nothing's left behind that could get accidentally referenced later.

## How to verify it actually worked

1. With an empty-ish organization (or a fresh test org), load the dashboard — every card should render with real, mostly-empty data instead of erroring. `Math.max(...[], 1)` and similar guards should mean an empty `revenueSeries` doesn't crash the bar-height calculation.
2. Create a product with a low `reorderPoint` and no stock, reload — it should appear in "Products to reorder."
3. Create and confirm a sales order, reload — the customer should appear in "Top customers" with the right `totalRevenue`, and the product should appear in "Top products" with the right `unitsSold`.
4. Create a sales order and only partially pay it, reload — it should appear in "Unpaid sales orders" with the correct `balanceDue`.
5. Run an `adjustStock` call, reload — it should appear in "Recent inventory activity" with a sensible relative time ("2m ago", not a raw timestamp) and the right `+`/`-` styling.
6. Compare the revenue chart's total against `topCustomers`' totals summed together, same as the sanity check from Step 6 — they should still roughly agree now that they're both rendering on the same page.

## Deliberately left out of Step 7

- **"To purchase" vs. "to transfer" detection on the reorder card.** Would need logic that checks whether *another* warehouse has surplus stock of the same product before suggesting a transfer instead of a purchase — a real feature, not a mapping exercise. Every low-stock item shows as "to purchase" for now.
- **Human-readable PO/SO numbers.** Still not built (flagged back in Step 4) — the dashboard is using a truncated id as a stand-in.
- **Auto-refreshing data.** This is a Server Component — it fetches once, on page load. A "refresh" button, polling, or websocket-driven live updates are all reasonable future additions, not part of getting the numbers *correct* in the first place.
- **Caching the `orchestrate` calls.** Same note as Step 6 — fine to revisit if the dashboard feels slow once there's real volume of data, not a concern at the size you're testing at now.
