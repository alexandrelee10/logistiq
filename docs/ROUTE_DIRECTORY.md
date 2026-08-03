# Logistiq — Route Directory

Last audited: 2026-08-02

Legend: ✅ live and reachable · 🚧 page exists but incomplete · ❌ linked from the sidebar but no page exists yet (404)

## Public / auth routes

| Route | File | Notes |
|---|---|---|
| `/` | `app/page.tsx` | Root landing redirect/entry |
| `/landingPage` | `app/landingPage/page.tsx` | Marketing home |
| `/landingPage/about` | `app/landingPage/about/page.tsx` | |
| `/landingPage/platform` | `app/landingPage/platform/page.tsx` | |
| `/landingPage/pricing` | `app/landingPage/pricing/page.tsx` | |
| `/landingPage/resources` | `app/landingPage/resources/page.tsx` | |
| `/landingPage/solutions` | `app/landingPage/solutions/page.tsx` | |
| `/sign-in` | `app/(auth)/sign-in/page.tsx` | |
| `/sign-up` | `app/(auth)/sign-up/page.tsx` | |
| `/accept-invite` | `app/(auth)/accept-invite/page.tsx` | Invite acceptance flow |

## Dashboard routes

Everything under `/dashboard` is gated by `app/dashboard/layout.tsx` — no session cookie, no page.

| Sidebar section | Linked route | Status | Actual page | Notes |
|---|---|---|---|---|
| Overview | `/dashboard` | ✅ | `app/dashboard/page.tsx` | |
| Inventory → Products | `/dashboard/inventory/products` | ✅ | `app/dashboard/inventory/products/page.tsx` | List, filters, search, New Product, Reorder |
| *(product row click)* | `/dashboard/inventory/products/[id]` | ✅ | `app/dashboard/inventory/products/[id]/page.tsx` | Detail page — inFlow-style redesign in progress, see `docs/STATUS.md` |

> Component note: as of 2026-08-02, `ProductsTable.tsx`, `CreateProductModal.tsx`, and
> `ProductDetailActions.tsx` live under `app/components/dashboard/Inventory/products/`, and
> `ReorderModal.tsx` lives under `app/components/dashboard/Inventory/reorder/` — moved out of a flat
> `app/components/dashboard/` layout. This reorg was uncommitted in the working tree at last check;
> see `docs/STATUS.md`.
| Inventory → Reorder | `/dashboard/inventory/reorder` | ❌ | — | **No page.** Reorder is a modal (`ReorderModal.tsx`), not a route — this sidebar link 404s |
| Inventory → Current Stock | `/dashboard/inventory/currentStock` | ❌ | — | **Path mismatch.** The actual page lives at `/dashboard/inventory` (`app/dashboard/inventory/page.tsx`), not `/currentStock` |
| Inventory → Stock Adjustments | `/dashboard/inventory/stockAdjustments` | ❌ | — | **Path mismatch.** The actual page lives at `/dashboard/inventory/adjustments` |
| Inventory → Stock Transfers | `/dashboard/inventory/stockTransfers` | ❌ | — | **No page at all.** `transferStock` action exists in `app/modules/inventory/inventory.ts`, no UI built |
| Orders (section + View/Create) | `/dashboard/orders`, `/dashboard/orders/new` | ❌ | — | No pages. Sales-order actions exist in `app/modules/sales/sales.ts` |
| Warehouses (section + View/Add) | `/dashboard/warehouses`, `/dashboard/warehouses/new` | ❌ | — | No pages. `createWarehouse`/`listWarehouse` exist in `app/modules/warehouses/warehouse.ts` |
| Purchase Orders (section + View/Create) | `/dashboard/purchase-orders`, `/dashboard/purchase-orders/new` | ❌ | — | No pages. Full PO lifecycle (`createPurchaseOrder` → `submitPurchaseOrder` → `approvePurchaseOrder` → `receivePurchaseOrder`) already exists in `app/modules/purchasing/purchasing.ts` |
| Reports (section + View/Build) | `/dashboard/reports`, `/dashboard/reports/new` | ❌ | — | No pages. `revenueByDay`, `topProducts`, `topCustomers` exist in `app/modules/reports/reports.ts` |
| Integrations | `/dashboard/integrations`, `/dashboard/integrations/new` | ❌ | — | No pages, no backend module either |
| Settings | `/dashboard/settings` | ❌ | — | No page. Invite/team actions exist in `app/modules/teams/teams.ts` but have no UI |

## API routes

| Route | File | Purpose |
|---|---|---|
| `POST /api/auth/sign-in` | `app/api/auth/sign-in/route.ts` | |
| `POST /api/auth/sign-up` | `app/api/auth/sign-up/route.ts` | |
| `POST /api/auth/sign-out` | `app/api/auth/sign-out/route.ts` | |
| `POST /api/auth/accept-invite` | `app/api/auth/accept-invite/route.ts` | |
| `POST /api/requests` | `app/api/requests/route.ts` | Single dispatch endpoint — every client action (`createProduct`, `createPurchaseOrder`, etc.) posts here with `{ action, ...data }`, which hands off to `orchestrate()` → the matching handler in `app/modules/*/*.ts` via the registry in `app/lib/registry.ts` |

## Registered server actions with no UI yet

These are fully implemented in `app/modules/*` (real Prisma queries, permission-checked) but have no page calling them. Wiring a page to one of these is almost always faster than it looks — the hard part (the action) is already done.

- **Warehouses:** `createWarehouse`, `listWarehouse`
- **Suppliers:** `createSupplier`, `listSuppliers` (used inside `ReorderModal`, but no standalone supplier management page)
- **Purchase orders:** `listPurchaseOrders`, `submitPurchaseOrder`, `approvePurchaseOrder`, `cancelPurchaseOrder`, `receivePurchaseOrder`, `updatePurchaseOrderPurchasingLine`
- **Sales:** `createCustomer`, `listCustomers`, `createSalesOrder`, `listSalesOrders`, `confirmSalesOrder`, `cancelSalesOrder`, `fulfillSalesOrder`, `updateSalesOrderLine`
- **Payments:** `recordPayment`, `refundPayment`
- **Reports:** `revenueByDay`, `topProducts`, `topCustomers`
- **Teams:** `createInvite`, `listInvites`, `revokeInvite`
- **Inventory:** `transferStock` (adjustStock/listInventory/listInventoryEvents already have UI on the Adjustments and product detail pages)
