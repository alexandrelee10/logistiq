/**
 * One-off seed script: gives test@testcenter.com's organization three
 * warehouses and a handful of products with deliberately different stock
 * levels per warehouse, so the WarehouseFilter dropdown actually shows
 * different "Products to reorder" results depending on what's selected.
 *
 * Run locally (where you have real DB access), from the project root:
 *   npx tsx scripts/seed-test-warehouses.ts
 *
 * Safe to run more than once — warehouses and products are upserted by
 * their unique keys, so re-running just resets the inventory quantities
 * back to this script's plan instead of creating duplicates.
 */

import "dotenv/config";
import { prisma } from "../app/lib/prisma";

const TEST_EMAIL = "test@testcenter.com";

async function main() {
  const user = await prisma.user.findUnique({ where: { email: TEST_EMAIL } });
  if (!user) {
    throw new Error(`No user found with email ${TEST_EMAIL} — check the address and try again.`);
  }

  const organizationId = user.organizationId;
  console.log(`Found ${TEST_EMAIL} in organization ${organizationId}`);

  const warehouseSpecs = [
    { code: "MAIN", name: "Main Warehouse" },
    { code: "NORTH", name: "North Facility" },
    { code: "SOUTH", name: "South Facility" },
  ];

  const warehouses = [];
  for (const spec of warehouseSpecs) {
    const wh = await prisma.warehouse.upsert({
      where: { organizationId_code: { organizationId, code: spec.code } },
      update: {},
      create: { organizationId, name: spec.name, code: spec.code },
    });
    warehouses.push(wh);
  }
  const [main, north, south] = warehouses;
  console.log("Warehouses ready:", warehouses.map((w) => `${w.name} (${w.code})`).join(", "));

  const productSpecs = [
    { sku: "TEST-WIDGET", name: "Test Widget", reorderPoint: 20 },
    { sku: "TEST-GADGET", name: "Test Gadget", reorderPoint: 15 },
    { sku: "TEST-GIZMO", name: "Test Gizmo", reorderPoint: 10 },
  ];

  const products = [];
  for (const spec of productSpecs) {
    const p = await prisma.product.upsert({
      where: { organizationId_sku: { organizationId, sku: spec.sku } },
      update: { reorderPoint: spec.reorderPoint },
      create: { organizationId, sku: spec.sku, name: spec.name, reorderPoint: spec.reorderPoint, attributes: {} },
    });
    products.push(p);
  }
  const [widget, gadget, gizmo] = products;
  console.log("Products ready:", products.map((p) => `${p.name} (reorder @ ${p.reorderPoint})`).join(", "));

  // Deliberately different per warehouse, so each filter option shows a
  // genuinely different result — see the printed table at the end for
  // exactly what to expect from each one.
  const stockPlan: { productId: string; warehouseId: string; quantity: number }[] = [
    { productId: widget.id, warehouseId: main.id, quantity: 50 },
    { productId: widget.id, warehouseId: north.id, quantity: 5 },
    { productId: widget.id, warehouseId: south.id, quantity: 40 },

    { productId: gadget.id, warehouseId: main.id, quantity: 3 },
    { productId: gadget.id, warehouseId: north.id, quantity: 30 },
    { productId: gadget.id, warehouseId: south.id, quantity: 25 },

    { productId: gizmo.id, warehouseId: main.id, quantity: 2 },
    { productId: gizmo.id, warehouseId: north.id, quantity: 4 },
    { productId: gizmo.id, warehouseId: south.id, quantity: 1 },
  ];

  for (const item of stockPlan) {
    await prisma.inventoryItem.upsert({
      where: { productId_warehouseId: { productId: item.productId, warehouseId: item.warehouseId } },
      update: { quantity: item.quantity },
      create: item,
    });
  }

  console.log("\nDone. Expected 'Products to reorder' per filter:");
  console.log("  All Warehouses      -> Test Gizmo only (its total across all 3 is 7, <= reorder point 10)");
  console.log(`  ${main.name.padEnd(19)}-> Test Gadget, Test Gizmo`);
  console.log(`  ${north.name.padEnd(19)}-> Test Widget, Test Gizmo`);
  console.log(`  ${south.name.padEnd(19)}-> Test Gizmo only`);
  console.log("\nIf what you see in the dashboard doesn't match this table, that's a real bug to chase — not expected variance.");

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
