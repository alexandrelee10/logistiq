app/
│
├── (marketing)/
│   ├── layout.tsx
│   ├── page.tsx                          → /
│   ├── pricing/page.tsx
│   └── about/page.tsx
│
├── (auth)/
│   ├── layout.tsx
│   ├── sign-in/page.tsx
│   ├── sign-up/page.tsx
│   ├── forgot-password/page.tsx
│   └── invite/[token]/page.tsx           → accept org invite
│
├── (app)/                                ← all protected routes
│   ├── layout.tsx                        ← org context, role provider
│   │
│   ├── [orgSlug]/                        ← multi-tenant root
│   │   │
│   │   ├── dashboard/page.tsx
│   │   │
│   │   ├── dispatch/
│   │   │   ├── page.tsx                  → kanban board
│   │   │   └── [loadId]/page.tsx         → load detail / timeline
│   │   │
│   │   ├── loads/
│   │   │   ├── page.tsx
│   │   │   ├── new/page.tsx
│   │   │   └── [loadId]/
│   │   │       ├── page.tsx
│   │   │       ├── edit/page.tsx
│   │   │       └── documents/page.tsx
│   │   │
│   │   ├── drivers/
│   │   │   ├── page.tsx
│   │   │   ├── new/page.tsx
│   │   │   └── [driverId]/
│   │   │       ├── page.tsx              → profile + HOS + history
│   │   │       ├── documents/page.tsx
│   │   │       └── performance/page.tsx
│   │   │
│   │   ├── fleet/                        ← NEW
│   │   │   ├── page.tsx                  → all vehicles
│   │   │   ├── new/page.tsx
│   │   │   └── [vehicleId]/
│   │   │       ├── page.tsx
│   │   │       └── maintenance/page.tsx  → service history + alerts
│   │   │
│   │   ├── maintenance/                  ← NEW — maintenance team view
│   │   │   ├── page.tsx                  → work orders board
│   │   │   ├── work-orders/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/page.tsx
│   │   │   │   └── [workOrderId]/page.tsx
│   │   │   └── inspections/
│   │   │       ├── page.tsx              → DVIRs list
│   │   │       └── [inspectionId]/page.tsx
│   │   │
│   │   ├── safety/                       ← NEW — driver leaders / safety mgr
│   │   │   ├── page.tsx                  → safety dashboard
│   │   │   ├── incidents/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [incidentId]/page.tsx
│   │   │   ├── violations/page.tsx       → HOS violations log
│   │   │   └── scorecards/page.tsx       → driver scorecards
│   │   │
│   │   ├── compliance/                   ← NEW
│   │   │   ├── page.tsx
│   │   │   ├── hos/page.tsx              → hours of service overview
│   │   │   ├── licenses/page.tsx         → CDL + medical card expiries
│   │   │   └── ifta/page.tsx             → fuel tax reporting
│   │   │
│   │   ├── accounting/                   ← NEW
│   │   │   ├── page.tsx
│   │   │   ├── invoices/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [invoiceId]/page.tsx
│   │   │   ├── settlements/page.tsx      → driver pay settlements
│   │   │   └── reports/page.tsx          → P&L, cost per mile
│   │   │
│   │   ├── customers/                    ← NEW — shipper/broker contacts
│   │   │   ├── page.tsx
│   │   │   ├── new/page.tsx
│   │   │   └── [customerId]/page.tsx
│   │   │
│   │   ├── fuel/
│   │   │   ├── page.tsx
│   │   │   └── transactions/page.tsx
│   │   │
│   │   ├── documents/page.tsx
│   │   │
│   │   ├── reports/                      ← NEW
│   │   │   ├── page.tsx
│   │   │   ├── operations/page.tsx
│   │   │   ├── financial/page.tsx
│   │   │   └── compliance/page.tsx
│   │   │
│   │   └── settings/
│   │       ├── page.tsx
│   │       ├── organization/page.tsx
│   │       ├── team/page.tsx             → invite + manage members
│   │       ├── roles/page.tsx            → custom role builder
│   │       ├── billing/page.tsx
│   │       └── integrations/page.tsx     → ELD, Samsara, Motive, QuickBooks
│   │
│   └── driver/                           ← driver portal (mobile-first)
│       ├── layout.tsx
│       ├── dashboard/page.tsx
│       ├── loads/
│       │   ├── page.tsx
│       │   └── [loadId]/page.tsx
│       ├── hos/page.tsx                  → HOS clock
│       ├── dvir/page.tsx                 → pre/post trip inspection
│       └── documents/page.tsx
│
├── api/
│   ├── auth/[...nextauth]/route.ts
│   │
│   ├── orgs/
│   │   ├── route.ts                      POST — create org
│   │   └── [orgId]/
│   │       ├── route.ts                  GET PATCH
│   │       └── members/route.ts          GET POST DELETE
│   │
│   ├── loads/
│   │   ├── route.ts                      GET POST
│   │   └── [loadId]/
│   │       ├── route.ts                  GET PATCH DELETE
│   │       ├── assign/route.ts           POST
│   │       ├── status/route.ts           PATCH
│   │       └── documents/route.ts        GET POST
│   │
│   ├── drivers/
│   │   ├── route.ts                      GET POST
│   │   └── [driverId]/
│   │       ├── route.ts                  GET PATCH
│   │       ├── hos/route.ts              GET
│   │       └── performance/route.ts      GET
│   │
│   ├── fleet/
│   │   ├── route.ts                      GET POST
│   │   └── [vehicleId]/
│   │       ├── route.ts                  GET PATCH
│   │       └── maintenance/route.ts      GET POST
│   │
│   ├── maintenance/
│   │   ├── work-orders/route.ts          GET POST
│   │   └── inspections/route.ts          GET POST
│   │
│   ├── safety/
│   │   ├── incidents/route.ts            GET POST
│   │   └── violations/route.ts           GET
│   │
│   ├── compliance/
│   │   ├── hos/route.ts                  GET
│   │   ├── licenses/route.ts             GET PATCH
│   │   └── ifta/route.ts                 GET POST
│   │
│   ├── accounting/
│   │   ├── invoices/route.ts             GET POST
│   │   └── settlements/route.ts          GET POST
│   │
│   ├── documents/
│   │   ├── route.ts                      GET POST
│   │   └── upload/route.ts               POST — presigned S3 URL
│   │
│   ├── webhooks/
│   │   ├── stripe/route.ts
│   │   ├── eld/route.ts                  ← ELD provider pushes events here
│   │   └── samsara/route.ts              ← GPS/telematics webhooks
│   │
│   ├── stripe/
│   │   └── checkout/route.ts
│   │
│   └── ai/
│       ├── dispatch/route.ts             ← DispatchGPT
│       └── insights/route.ts             ← fleet analytics AI
│
├── middleware.ts                         ← auth + org + role guards
├── layout.tsx
├── not-found.tsx
└── error.tsx