# Flow Diagrams Roadmap

Living index of flowcharts for Logistiq, in Mermaid, checked into `docs/product/flows/`. Each is grounded in the actual code (schema, API routes, modules, pages), not just the intended design — so gaps between "what the sidebar promises" and "what page actually exists" are called out directly in the diagrams.

## Diagrammed and implemented
- [x] **Sign-up / join-org / invitation-acceptance** — `sign-up-flow.md`. Redesigned and shipped: create-vs-join toggle, forced ADMIN role on org creation, confirm-password, working `/accept-invite` page + preview endpoint, auto-login, expiry enforcement.

## Diagrammed — implementation not yet started
- [x] **Sign-in flow** — `sign-in-flow.md`. Solid as-is; minor gaps noted (rate limiting, remember-me, dead SSO buttons, no password reset).
- [x] **Invitation creation (admin side)** — `invitation-creation-flow.md`. Backend complete, zero UI — no page exists to send an invite from.
- [x] **Dashboard flow** — `dashboard-flow.md`. Data layer is solid; two dead buttons, and most sidebar links 404.
- [x] **Add inventory flow** — `add-inventory-flow.md`. Backend ledger (product creation, PO receiving, manual adjustment) is the strongest part of the app; all three UI entry points are missing or placeholder.
- [x] **View inventory flow** — `view-inventory-flow.md`. Mostly working today; gaps are polish (low-stock highlighting, per-item drill-down, search/sort).
- [x] **Purchase order lifecycle flow** — `purchase-order-flow.md`. Full 6-state backend state machine, zero UI.
- [x] **Sales order + payment flow** — `sales-payment-flow.md`. Full state machine + payment ledger, zero UI; one typo bug noted (`"fufilled"` vs `"fulfilled"` in `cancelSalesOrder`).

## Biggest theme across all of them
The backend/data layer is consistently ahead of the UI — purchasing, sales, and invitations are fully built and tested at the `orchestrate`/module level but have **no pages at all**, while the sidebar (`Sidebar.tsx`) already links to all of them. That's the highest-leverage next phase: the hard state-machine and ledger work is done, what's left is mostly connecting real forms/tables to already-working actions.

## Suggested build order (by effort-to-value)
1. Inventory adjustments page (data already fetched, just needs a form) — cheapest win.
2. Invitation creation UI (closes the loop the accept-invite work already opened).
3. Purchase orders (list + new + receive) — closes the dashboard's reorder loop.
4. Sales orders + payments (list + new + record payment) — closes the dashboard's unpaid-orders loop.
5. Add Product page.
6. Dashboard polish (wire the two dead buttons once their targets exist).
7. Sign-in polish (rate limiting, password reset) — lowest urgency, current flow isn't broken.

## Deferred product decisions (from the audit, not flow-specific)
- [ ] Make `phoneNumber` optional at signup (requires a Prisma migration).
- [ ] Email verification after signup.
- [ ] Real email delivery for invites (currently a copy/paste link).
- [ ] Fix `"fufilled"` typo in `cancelSalesOrder`.

Add to this list as new flows come up — each entry should end with a Mermaid diagram plus an "assessment" section like the files above.
