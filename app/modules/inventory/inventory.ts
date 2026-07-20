import { applyStockDelta, StockBelowZeroError } from "@/app/lib/inventory";
import { prisma } from "@/app/lib/prisma";
import { register } from "@/app/lib/registry";



register("adjustStock", async(data,ctx) => {
    const { productId, warehouseId, delta, reason } = data; // delta is the amount we're changing something by

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
    try {
        const item = await prisma.$transaction(async (tx) => {
            // Locks inventory and starts mutating it
            const item = await applyStockDelta(tx, productId, warehouseId, delta);
            // Creates a record to be able to refer to 
            await tx.inventoryRecord.create({
                data: { productId, warehouseId, delta, reason: reason ?? null, userId: ctx.userId },
            });
            return item;
        });

        return { status: 200, body: { item } };
    } catch (err) {
        // Return personal error superset
        if (err instanceof StockBelowZeroError) {
            return { status: 400, body: { error: err.message } };
        }
        throw err; // anything else falls through 
    }
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

register("transferStock", async (data, ctx) => {
    const { productId, fromWarehouseId, toWarehouseId, quantity, reason } = data;

    if (!productId || !fromWarehouseId || !toWarehouseId || typeof quantity !== "number" || quantity <= 0 ) {
        return { status: 400, body: { error: "productId, fromWarehouseId, toWarehouseId, and a positive quantity are required.} " } };
    }

    if (fromWarehouseId === toWarehouseId) { 
        return { status: 400, body: { error: "Source and destination warehouses must be different." } } 
    }

    const [product, fromWarehouse, toWarehouse] = await Promise.all([
        prisma.product.findFirst({ where: { id: productId, organizationId: ctx.organizationId}}),
        prisma.warehouse.findFirst({ where: { id: fromWarehouseId, organizationId: ctx.organizationId}}),
        prisma.warehouse.findFirst({ where: { id: toWarehouseId, organizationId: ctx.organizationId}}),
    ]);

    if (!product || !fromWarehouse || !toWarehouse) {
        return { status: 404, body: { error: "Product or warehouse not found. "}}
    }

    try {
        const result = await prisma.$transaction( async(tx) => {
            const fromItem = await applyStockDelta(tx, productId, fromWarehouseId, -quantity);
            const toItem = await applyStockDelta(tx, productId, toWarehouseId, quantity);

            await tx.inventoryRecord.createMany({
                data: [
                    // Shipping warehouse
                    {
                        productId,
                        warehouseId: fromWarehouseId,
                        delta: -quantity,
                        reason: reason ?? "transfer out",
                        userId: ctx.userId,
                    },
                    // Receiving warehouse
                    {
                        productId,
                        warehouseId: toWarehouseId,
                        delta: quantity,
                        reason: reason ?? "transfer in",
                        userId: ctx.userId,
                    }
                ],
            });
            return { fromItem, toItem };
        });
        return { status: 200, body: result };
        
    } catch (err) {
        if (err instanceof StockBelowZeroError) {
            return { status: 400, body: { error: "Not enough stock in the source warehouse."} };
        }
        throw err;
    }
});

register("listInventoryEvents", async (data, ctx) => {
    const { productId, warehouseId, limit } = data;

    const events = await prisma.inventoryRecord.findMany({
        where: {
            product: { organizationId: ctx.organizationId },
            warehouse: { organizationId: ctx.organizationId },
            ...(productId ? { productId } : {}),
            ...(warehouseId ? { warehouseId }: {}),
        },
        include: { product: true, warehouse: true },
        orderBy: { createdAt: "desc" },
        take: typeof limit === "number" ? limit : 20,
    });

    return { status: 200, body: { events }}
})