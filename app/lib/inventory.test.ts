import { describe, it, expect } from "vitest"
import { prisma } from "./prisma"
import { nextOrderNumber } from "./order-number";
import { applyStockDelta } from "./inventory";
import { slugify } from "./slug";

describe("applyStockDelta - concurrency", () => {
    it("keeps the right total when two adjustments happen at the same time", async () => {
        // Create an organization, warehouse, and product to test
        const org = await prisma.organization.create({ data: { name: "Test Co", slug: slugify("Test Co") } });

        const warehouse = await prisma.warehouse.create({
            data: { organizationId: org.id, name: "Main", code: "MAIN" },
        });

        const product = await prisma.product.create({
            data: { organizationId: org.id, sku: "widget-1", name: "Widget", attributes: {} },
        });

        // Use 2 adjustments at the exact same row
        await Promise.all([
            prisma.$transaction((tx) => applyStockDelta(tx, product.id, warehouse.id, 10)),
            prisma.$transaction((tx) => applyStockDelta(tx, product.id, warehouse.id, 10)),
        ]);

        const item = await prisma.inventoryItem.findUnique({
            where: { productId_warehouseId: { productId: product.id, warehouseId: warehouse.id } },
        });

        expect(item?.quantity).toBe(20);
    });
});

// This is supposed to add 10+10 to trhis empty warehouse and should produce 10. Attempting to avoid race condition