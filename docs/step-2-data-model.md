# Step 2 — The Data Model Foundation (Multi-Tenant)

Companion to `CharterRoute_Pattern_Conceptual_Guide.pdf`, sections 4 ("Letting Many Companies Share One App Safely") and 5 ("Why Some Data Is Stored as 'Just a Blob of JSON'"), applied to Logistiq. You confirmed this is going to be multi-tenant SaaS — multiple companies, each seeing only their own inventory — so that decision is baked into everything below.

**Scope of this step:** the foundation everything else depends on — `Organization`, `Product`, `Warehouse`, `InventoryItem` — plus updating sign-up to actually create an organization. Orders, purchase orders, and customers/suppliers all reference products and warehouses, so they're a **Step 2b** once this is in place and working, not part of this doc.

## Why organization-scoping has to happen now, not later

Right now, `User` has no concept of "which company." The moment you add `Product`, if you don't also solve this, every product in the database is just floating in one shared pool — there'd be no way to stop Company A from seeing Company B's stock counts. Retrofitting an `organizationId` onto tables after they already have rows in them, and after dozens of queries already assume there's only one company, is real, tedious, error-prone work. Doing it now — before `Product` even exists — means every table is born with the ownership column already on it, and every query you write from day one just includes the filter naturally instead of needing to be patched in later.

This is the exact trade the concept guide describes: one shared database, isolation enforced entirely by remembering to filter on an ownership column, versus a separate database per company. You're taking the cheap, shared-database route (the right call at this stage) — which means the filter is now a habit you build starting with the very first query you write against `Product`, not something to bolt on later.

## The new folder structure

```
logistiq/
├─ prisma/
│  └─ schema.prisma              # ADD: Organization, Product, Warehouse, InventoryItem
│                                 # EDIT: User gets organizationId
├─ app/
│  ├─ lib/
│  │  └─ slug.ts                 # NEW: turns "Acme Co." into "acme-co-x7k2"
│  ├─ api/auth/
│  │  └─ sign-up/route.ts        # EDIT: create an Organization, then the User inside it
│  └─ components/auth/
│     └─ SignUpForm.tsx          # EDIT: add a "Company name" field
```

## Do it in this order

### 1. Add `Organization`, and put `organizationId` on `User`

```prisma
model Organization {
  id        String   @id @default(cuid())
  name      String
  slug      String   @unique
  createdAt DateTime @default(now())

  users User[]
}
```

And add the FK to the existing `User` model:

```prisma
model User {
  id             String   @unique @id
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id])

  // ...everything else on User stays exactly as it is...
}
```

Note what's deliberately *not* changing: `email` and `phoneNumber` stay globally unique across the whole app, not scoped per-organization. That's intentional — sign-in currently looks a user up by email alone, with no "which company" selector, so email has to keep meaning one specific person across the entire system (think Slack: your email is unique across all of Slack; which workspaces you belong to is a separate question).

**Before you migrate:** this makes `organizationId` a required field with no default. If you still have test users in the database from earlier testing, this migration will fail on them, because Prisma can't invent an organization for rows that already exist. Open `npx prisma studio` and delete your test users first — you're pre-launch, so per section 9 of the concept guide, freely wiping test data is exactly the right move right now. Then run:

```
npx prisma migrate dev --name add_organizations
```

### 2. Add `Product`, `Warehouse`, and `InventoryItem`

```prisma
model Product {
  id             String   @id @default(cuid())
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  sku          String
  name         String
  reorderPoint Int      @default(0)
  attributes   Json?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  inventoryItems InventoryItem[]

  @@unique([organizationId, sku])
}

model Warehouse {
  id             String   @id @default(cuid())
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  name String
  code String

  createdAt DateTime @default(now())

  inventoryItems InventoryItem[]

  @@unique([organizationId, code])
}

model InventoryItem {
  id String @id @default(cuid())

  productId String
  product   Product @relation(fields: [productId], references: [id], onDelete: Cascade)

  warehouseId String
  warehouse   Warehouse @relation(fields: [warehouseId], references: [id], onDelete: Cascade)

  quantity  Int      @default(0)
  updatedAt DateTime @updatedAt

  @@unique([productId, warehouseId])
}
```

A few design choices worth understanding, not just copying:

- **`sku`, `name`, `reorderPoint` are real columns — `attributes` is the flexible blob.** This is section 5's rule of thumb directly: your dashboard's "needs attention" logic constantly filters/sorts on reorder point and quantity, so those need to be real, queryable columns. Anything variable and product-specific you haven't decided on yet (color, weight, a custom spec sheet) goes in `attributes` — you can start sending new keys into that JSON blob tomorrow without a migration.
- **`@@unique([organizationId, sku])`, not just `@unique` on `sku`.** SKUs only need to be unique *within* a company, not across every company using Logistiq. Two unrelated businesses both having a "SKU-001" is completely normal and should not conflict. This compound-unique pattern is how you scope uniqueness to a tenant.
- **`InventoryItem` is a join table with a payload.** A product doesn't have one quantity — it has a different quantity in every warehouse. So instead of a `quantity` column directly on `Product`, there's a row per (product, warehouse) pair, and `@@unique([productId, warehouseId])` stops you from ever accidentally creating two conflicting rows for the same pair.
- **`onDelete: Cascade` on `Product`/`Warehouse`/`InventoryItem`, but not on `User`.** Deleting a warehouse should reasonably clean up its inventory rows automatically. Deleting an organization (a company canceling their account, say) is a much bigger, more dangerous action — worth making deliberate later rather than something that silently cascades through your whole schema today.

Migrate again:

```
npx prisma migrate dev --name add_inventory_foundation
```

### 3. Write `app/lib/slug.ts`

Sign-up is about to need a way to turn a typed-in company name into a URL/DB-safe slug.

```ts
export function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base}-${suffix}`;
}
```

"Acme Co." becomes `acme-co-x7k2`. The lowercase/replace/trim pipeline handles making it URL-safe; the random 4-character suffix means two different companies both typing "Acme" don't collide — and the `slug` column's own `@unique` constraint is still there as the real backstop if you're ever unlucky enough to hit the same suffix twice.

### 4. Add a "Company name" field to sign-up

In `validations/auth.ts`, add to `signupSchema`:

```ts
companyName: z.string().min(1, "Company name is required"),
```

In `SignUpForm.tsx`: add `companyName: ""` to the form state, and add a `Field` for it (same pattern as the existing First/Last name fields) — this one has to exist since there's no organization to join yet at sign-up time; every new sign-up creates a brand-new company.

### 5. Update `app/api/auth/sign-up/route.ts` to create the organization

Replace the single `prisma.user.create(...)` with a transaction that creates both, so you never end up with an organization and no user, or a user with no organization:

```ts
import { slugify } from "@/app/lib/slug";

// ...after the existingUser check, replace the prisma.user.create(...) block with:

await prisma.$transaction(async (tx) => {
  const organization = await tx.organization.create({
    data: {
      name: companyName,
      slug: slugify(companyName),
    },
  });

  await tx.user.create({
    data: {
      id: randomUUID(),
      organizationId: organization.id,
      firstName,
      lastName,
      phoneNumber,
      email,
      password: hashedPassword,
      role,
    },
  });
});
```

`$transaction` here means "run both of these, and if either one fails, undo both" — you don't want a half-signed-up state where a company exists with zero users, or a user exists pointing at an organization that never got created. Don't forget to destructure `companyName` alongside the other fields from `validation.data` near the top of the route.

## How to verify it actually worked

1. Sign up as two different "companies" (two different company names, two different emails). Open Prisma Studio and confirm you get two separate `Organization` rows, and each `User` row's `organizationId` points at the right one.
2. Try creating a `Product` with the same `sku` under two different organizations (you can do this directly in Prisma Studio for now, since there's no product UI yet) — it should succeed for both, proving the compound unique key is scoped correctly, not global.
3. Try creating two `Product` rows with the same `sku` under the *same* organization — this one should fail, proving the uniqueness constraint is actually being enforced where it matters.
4. Create one `InventoryItem` for a given product+warehouse pair, then try to create a second one for that exact same pair — should fail, proving you can't get two conflicting quantity rows for the same product in the same warehouse.

## Deliberately left out of Step 2

- **Orders, purchase orders, customers/suppliers** — Step 2b. They all hang off `Product` and `Warehouse`, which is why those had to come first.
- **Enforcing the organization filter in queries** — right now, nothing stops a handler from forgetting to filter by `organizationId`. That's Step 3 territory (the API layer), and it's the exact cost the concept guide flags in section 4: the schema *allows* safe isolation, but every query still has to remember to ask for it.
- **Row-Level Security as a database-level backstop** — the guide mentions this as an extra safety net so that even a query that forgot the filter can't leak data. Worth doing eventually; not necessary while you're the only one writing queries and can review them yourself.
