import { describe, it, expect } from "vitest"
import { prisma } from "./prisma"
import { nextOrderNumber } from "./order-number";
import { slugify } from "./slug";

describe("nextOrderNumber", async () => {
    it("starts at 1001 and increments by one each call, within the same org", async () => {
const org = await prisma.organization.create({ data: { name: "Test Co", slug: slugify("Test Co") } });

        const first = await prisma.$transaction((tx) => nextOrderNumber(tx, org.id, "PO"));
        const second = await prisma.$transaction((tx) => nextOrderNumber(tx, org.id, "PO"));

        expect(first).toBe("PO-1001");
        expect(second).toBe("PO-1002");
    });
});

/**
 * The goal of this is to ensure that this correctlty assigns the order number based on whats already in inventory. 
 */