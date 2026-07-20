import { prisma } from "@/app/lib/prisma";
import { register } from "@/app/lib/registry";



register("adjustStock", async(data,ctx) => {
    const { productId, warehouseId, delta } = data; // delta is the amount we're changing something by

    // Validation check
    if (!productId || !warehouseId || typeof delta !== "number" || delta === 0) {
        return {
            status: 400,
            body: { error: "productId, warehouseId, and a non-zero numeric delta are required." },
        };
    }

    // Ensure the product and warehouse exists. Using Promise.all() I did them together
    const [product, warehouse] = await Promise.all([
        prisma.product.findFirst({ where: { id: productId, organizationId: ctx.organizationId } }),
        prisma.warehouse.findFirst({ where: { id: warehouseId, organizationId: ctx.organizationId } }),
    ]);

    // Checking whether or not they exist and handling it
    if (!product || !warehouse) {
        return { status: 404, body: { error: "Product or warehouse not found" } };
    };

    const existingInventory = await prisma.inventoryItem.findUnique({
        where: { productId_warehouseId: { productId, warehouseId } }
    });

    const nextQuantity = (existingInventory?.quantity ?? 0) + delta; // Calculate next quantity

    // Negative inventory prevention
    if (nextQuantity < 0) {
        return { status: 400, body: { error: "That would take stock below zero." } }; 
    }

    const item = await prisma.inventoryItem.upsert({
        where: { productId_warehouseId: { productId, warehouseId } },
        create: { productId, warehouseId, quantity: nextQuantity },
        update: { quantity: nextQuantity },
    });

    return { status: 200, body: { item } };
});


register("listInventory", async (data, ctx) => {
    const { warehouseId, productId } = data;

    const items = await prisma.inventoryItem.findMany({
        where: {
            product: { organizationId: ctx.organizationId },
            warehouse: { organizationId: ctx.organizationId },
            ...(warehouseId ? { warehouseId } : {}),
            ...(productId ? { productId} : {})
        },
        include: { product: true, warehouse: true },
    });
    return { status: 200, body: { items } };
});

register("lowStock", async (_data, ctx) => {
    const products = await prisma.product.findMany({
        where: { organizationId: ctx.organizationId },
        include: { inventoryItems: true },
    });

    const lowStock = products
    .map((p) => ({
        ...p,
        totalQuantity: p.inventoryItems.reduce((sum, i) => sum + i.quantity, 0),
    }))
    .filter((p) => p.totalQuantity <= p.reorderPoint);

    return { status: 200, body: { products: lowStock } };
})
