# Where I left off

Last updated: 2026-08-02. Read this first when picking the project back up.

## Uncommitted right now — check this before doing anything else

`git status` shows a component reorg in progress, not yet committed:
`app/components/dashboard/` is being split from a flat file layout into subfolders
(`Inventory/products/`, `Inventory/reorder/`). Specifically, uncommitted right now:
- `app/components/dashboard/Inventory/products/ProductsTable.tsx` — import paths updated to
  `../reorder/ReorderModal` and `../products/CreateProductModal`
- `app/dashboard/inventory/products/page.tsx` — updated to import `ProductsTable` from its new location

Current file locations (already moved): `ProductsTable.tsx`, `CreateProductModal.tsx`, and
`ProductDetailActions.tsx` live under `app/components/dashboard/Inventory/products/`; `ReorderModal.tsx`
lives under `app/components/dashboard/Inventory/reorder/`. The rest of this document and
`docs/ROUTE_DIRECTORY.md` use these current paths. If you're pushing today, commit this reorg together
with (or before) anything else — the two files above are already relying on the new structure, so reverting
one without the other would break the build.

## Current focus: Inventory section

Working through the Inventory area of the dashboard. Within it:

### Done
- **Reorder flow** — `ReorderModal.tsx` (`app/components/dashboard/Inventory/reorder/`) works from both a product row (locked to that product) and the
  page-level "Reorder" button (product picker). Permission-gated (`ADMIN`/`MANAGER`/`PURCHASING` only,
  via `canReorder` computed server-side in `page.tsx`).
- **Products — list page** (`/dashboard/inventory/products`) — search, category filter, low-stock filter,
  New Product modal, category creation inline from that modal.
- **Products — quantity-typing bug** — quantity fields in both modals now accept typed input properly
  (was: only the spinner arrows worked). See `docs/guides/Logistiq_Inventory_Features_Explained.pdf` §3
  if the reasoning needs a refresher.
- **Products — detail page** (`/dashboard/inventory/products/[id]`) — exists, reachable by clicking a row,
  shows stock by warehouse + recent activity + reorder point + price.

### In progress — not finished
- **Product detail page redesign (inFlow-style layout).** A new tabs component,
  `ProductOverviewTabs.tsx`, was built and saved as a *reference* file at
  `docs/guides/ProductOverviewTabs.reference.tsx` — **it has not been wired into the live page yet.**
  The actual `app/dashboard/inventory/products/[id]/page.tsx` still has the old flat header + 4 stat
  cards + two-table layout. Two things are still needed to finish this:
  1. Copy/adapt `ProductOverviewTabs.reference.tsx` into `app/components/dashboard/Inventory/products/`
     (matching where its siblings now live) and import it in `page.tsx`, replacing the
     "Stock by warehouse / Recent activity" grid.
  2. Rebuild the header block (image placeholder + two-column spec grid) per
     `docs/guides/Rebuilding_Product_Page_Layout_Guide.pdf` §3 — full JSX to paste is in that guide.

  The three PDFs in `docs/guides/` walk through both pieces step by step if the "why" needs re-reading:
  `React_Client_Components_Explained.pdf`, `Product_Tabs_With_useState_Explained.pdf`,
  `Rebuilding_Product_Page_Layout_Guide.pdf`.

- **Two features deliberately deferred, need a schema decision before building:**
  - *Pricing & Cost card* (markup/cost breakdown like inFlow's) — needs a `cost` field added to
    `Product` in `schema.prisma` first. Sketch is in the layout guide, §4.
  - *Remarks* (free-text note on a product) — needs a `remarks String?` field added to `Product`.
    Sketch is in the layout guide, §5.

### Known bugs to fix (found while auditing, not yet touched)
Four sidebar links under **Inventory** currently 404 or point at the wrong path — see
`docs/ROUTE_DIRECTORY.md` for the full table:
- "Reorder" → links to `/dashboard/inventory/reorder`, which doesn't exist (Reorder is a modal, not a page)
- "Current Stock" → links to `/dashboard/inventory/currentStock`; the real page is at `/dashboard/inventory`
- "Stock Adjustments" → links to `/dashboard/inventory/stockAdjustments`; the real page is at
  `/dashboard/inventory/adjustments`
- "Stock Transfers" → no page exists; `transferStock` action exists server-side, unused

These are one-line fixes in `app/components/dashboard/Sidebar.tsx` (`MAIN_NAV` → Inventory → `actions`)
once you're ready — either fix the `href`s to match the real paths, or build the missing pages.

## Not started yet (whole sections)

Everything below has working, permission-checked server actions already registered in `app/modules/`
— the backend logic exists, only the UI doesn't. See `docs/ROUTE_DIRECTORY.md` → "Registered server
actions with no UI yet" for the exact action names per section.

- **Orders** (sales orders) — `/dashboard/orders`
- **Warehouses** — `/dashboard/warehouses`
- **Purchase Orders** — `/dashboard/purchase-orders` (list/detail/approve/receive — Reorder only
  *creates* a PO today, there's no page to view or progress one afterward)
- **Reports** — `/dashboard/reports`
- **Integrations** — `/dashboard/integrations` (no backend module either — this one's from scratch)
- **Settings** / team & invites — `/dashboard/settings`

## Suggested order when picking back up

1. Finish the product detail redesign (wire in `ProductOverviewTabs` + the new header) — it's the closest
   thing to done and has full written guides already.
2. Fix or build the four broken Inventory sidebar links, since that's the section currently in progress.
3. Decide on the `cost` / `remarks` schema additions if those cards are wanted, or skip them.
4. Move to Purchase Orders next, not a brand-new section — the backend is fully built and Reorder
   already creates POs, so a list/detail page is mostly plumbing, not new logic.
