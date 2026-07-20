import { Prisma } from "@/generated/prisma/client";

// My reusuable exception
export class StockBelowZeroError extends Error {
    constructor() {
        super("That would take stock below zero.")
    }
}

export async function applyStockDelta(
    tx: Prisma.TransactionClient, // This function expects to receive a Prisma transaction.
    productId: string,
    warehouseId: string,
    delta: number
) {
    // Lock the item we're changing using "FOR UPDATE"
    const rows = await tx.$queryRaw<{ quantity: number }[]>` 
    SELECT quantity FROM "InventoryItem" 
    WHERE "productId"=${productId} AND "warehouseId"=${warehouseId}
    FOR UPDATE 
    `
    // Gets quantity from sql query
    const currentQuantity = rows[0]?.quantity ?? 0;
    const nextQuantity = currentQuantity + delta;

    if (nextQuantity < 0) {
        throw new StockBelowZeroError();
    }
    
    return tx.inventoryItem.upsert({
        where: { productId_warehouseId: { productId, warehouseId } },
        create: { productId, warehouseId, quantity: nextQuantity },
        update: { quantity: nextQuantity }
    });

    // Once completed the row unlocks again and another transaction with the quantity can be made
}