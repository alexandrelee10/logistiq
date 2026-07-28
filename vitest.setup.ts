
import { config } from "dotenv";
import { prisma } from "./app/lib/prisma";
import { beforeEach } from "vitest";

config({ path: ".env.test", override: true }); // Ensure this is always chosen

// Clear left over data for test

beforeEach(async () => {
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "Session", "InventoryRecord", "InventoryItem", "Payment",
      "SalesOrderLine", "SalesOrder", "PurchaseOrderLine", "PurchaseOrder",
      "Customer", "Supplier", "Invite", "OrderSequence",
      "User", "Product", "Warehouse", "Organization"
    CASCADE;
  `);
});