import { applyStockDelta } from "@/app/lib/inventory";
import { nextOrderNumber } from "@/app/lib/order-number";
import { prisma } from "@/app/lib/prisma";
import { register } from "@/app/lib/registry";

// Create a supplier 
register("createSupplier", async(data, ctx) => {
    const { name, email, phone } = data;

    if (!name) { 
        return { status: 400, body: { error:  "name is required" }}
    }

    const supplier = await prisma.supplier.create({
        data: {
            organizationId: ctx.organizationId,
            name,
            email: email ?? null, 
            phone: phone ?? null
        },
    });

    return { status: 201, body: { supplier }};
});

// List suppliers in organization 
register("listSuppliers", async (_data, ctx) => {
    const suppliers = await prisma.supplier.findMany({
        where: { organizationId: ctx.organizationId },
    });

    return { status: 200, body: { suppliers } };
});

type PurchaseOrderLineInput = { productId: string; quantity: number; unitCost?: number };

// Create purchase order 
register("createPurchaseOrder", async (data, ctx) => {
    const { supplierId, lines } = data as { supplierId: string; lines: PurchaseOrderLineInput[] };

    if (!supplierId || !Array.isArray(lines) || lines.length === 0) {
        return {
            status: 400,
            body: { error: "supplierId and a non-empty lines array are required." },
        };
    }

    for (const line of lines) {
        if (!line.productId || typeof line.quantity !== "number" || line.quantity <= 0) {
            return {
                status: 400,
                body: { error: "Each line needs a productId and a positive numeric quantity." },
            };
        }
    }

    const supplier = await prisma.supplier.findFirst({
        where: { id: supplierId, organizationId: ctx.organizationId },
    });
    if (!supplier) {
        return { status: 404, body: { error: "Supplier not found." } };
    }

    const productIds = lines.map((l) => l.productId);
    const products = await prisma.product.findMany({
        where: { id: { in: productIds }, organizationId: ctx.organizationId },
    });
    if (products.length !== new Set(productIds).size) {
        return { status: 404, body: { error: "One or more products not found." } };
    }

    const purchaseOrder = await prisma.$transaction(async (tx) => {
    const poNumber = await nextOrderNumber(tx, ctx.organizationId, "PO");

    const po = await tx.purchaseOrder.create({
        data: {
            organizationId: ctx.organizationId,
            poNumber,                                                     
            supplierId,
            status: "awaiting_approval",
        },
    });

    await tx.purchaseOrderLine.createMany({
        data: lines.map((l) => ({
            purchaseOrderId: po.id,
            productId: l.productId,
            quantityOrdered: l.quantity,
            unitCost: l.unitCost ?? null,
        })),
    });

    return tx.purchaseOrder.findUniqueOrThrow({
        where: { id: po.id },
        include: { purchaseOrderLines: true, supplier: true },
    });
});

    return { status: 201, body: { purchaseOrder } };
});

register("listPurchaseOrders", async (data, ctx) => {
    const { status } = data;

    const purchaseOrders = await prisma.purchaseOrder.findMany({
        where: {
            organizationId: ctx.organizationId,
            ...(status ? { status} : {})
        },
        include: { supplier: true, purchaseOrderLines: { include: { product: true} } },
        orderBy: { createdAt: "desc"}
    });

    return { status: 200, body: { purchaseOrders } };
});

// Submit purchase order
register("submitPurchaseOrder", async (data , ctx) => {
    const { purchaseOrderId } = data;

    const po = await prisma.purchaseOrder.findFirst({
        where: { id: purchaseOrderId, organizationId: ctx.organizationId },
    });
    if (!po) {
        return { status: 400, body: { error: "Purchase order not found."}}
    }

    if (po.status !== "approved") {
        return { status: 400, body: { error: `Cannot submit a purchase order with status "${po.status}".`} };
    }

    const purchaseOrder = await prisma.purchaseOrder.update({
        where: { id: purchaseOrderId },
        data: { status: "submitted" },
    });

    return { status: 200, body: { purchaseOrder } };
});

// Receive purchase order
register("receivePurchaseOrder", async (data, ctx) => {
    const { purchaseOrderId, warehouseId, receipts } = data;

    if (!purchaseOrderId || !warehouseId || !Array.isArray(receipts) || receipts.length === 0) {
        return {
            status: 400,
            body: { error: "purchaseOrderId, warehouseId, and a non-empty receipts array are required." },
        };
    }

    const [po, warehouse] = await Promise.all([
        prisma.purchaseOrder.findFirst({
            where: { id: purchaseOrderId, organizationId: ctx.organizationId },
            include: { purchaseOrderLines: true },
        }),
        prisma.warehouse.findFirst({ where: { id: warehouseId, organizationId: ctx.organizationId } }),
    ]);
    if (!po || !warehouse) {
        return { status: 404, body: { error: "Purchase order or warehouse not found." } };
    }
    // Ensures now that the purchase order was submitted
    if (po.status !== "submitted" && po.status !== "partially_received") {
        return { status: 400, body: { error: `Cannot receive a purchase order with status "${po.status}".`} };
    }

    // Validate every receipt against its line *before* writing anything.
    const linesById = new Map(po.purchaseOrderLines.map((l) => [l.id, l]));
    for (const r of receipts) {
        const line = linesById.get(r.lineId);
        if (!line) {
            return { status: 404, body: { error: `Line ${r.lineId} not found on this purchase order.` } };
        }
        const remaining = line.quantityOrdered - line.quantityReceived;
        if (typeof r.quantity !== "number" || r.quantity <= 0 || r.quantity > remaining) {
            return {
                status: 400,
                body: { error: `Line ${r.lineId} can accept at most ${remaining} more units.` },
            };
        }
    }

    const purchaseOrder = await prisma.$transaction(async (tx) => {
        for (const r of receipts) {
            const line = linesById.get(r.lineId)!;

            await applyStockDelta(tx, line.productId, warehouseId, r.quantity);
            await tx.inventoryRecord.create({
                data: {
                    productId: line.productId,
                    warehouseId,
                    delta: r.quantity,
                    reason: `purchase order ${purchaseOrderId} receipt`,
                    userId: ctx.userId,
                },
            });
            await tx.purchaseOrderLine.update({
                where: { id: r.lineId },
                data: { quantityReceived: { increment: r.quantity } },
            });
        }

        const updatedLines = await tx.purchaseOrderLine.findMany({ where: { purchaseOrderId } });
        const fullyReceived = updatedLines.every((l) => l.quantityReceived >= l.quantityOrdered);

        return tx.purchaseOrder.update({
            where: { id: purchaseOrderId },
            data: { status: fullyReceived ? "received" : "partially_received" },
            include: { purchaseOrderLines: true, supplier: true },
        });
    });

    return { status: 200, body: { purchaseOrder } };
});

// Approve purchase orders 
register("approvePurchaseOrder", async (data , ctx) => {
    const { purchaseOrderId } = data;

    const po = await prisma.purchaseOrder.findFirst({
        where: { id: purchaseOrderId ,organizationId: ctx.organizationId }
    });

    if (!po) {
        return {
            status: 400,
            body: { error: "Purchase order not found."}
        }
    }

    if (po.status !== "awaiting_approval") {
        return {
            status: 400,
            body: { error: `Cannot approve a purchase order with status "${po.status}".`}
        }
    }

    const purchaseOrder = await prisma.purchaseOrder.update({
        where: { id: purchaseOrderId },
        data: { status: "approved" },
    })

    return { status: 200, body: { purchaseOrder } };
});

// Cancel purchase order
register("cancelPurchaseOrder", async (data , ctx) => {
    const { purchaseOrderId } = data;

    const po = await prisma.purchaseOrder.findFirst({
        where: { id: purchaseOrderId, organizationId: ctx.organizationId },
    });
    
    if (!po) {
        return {
            status: 400,
            body: { error: "Purchase order not found" },
        }
    };

    if ( po.status === "received" ||po.status === "partially_received" ) {
        return {
            status: 400,
            body: { error: "Cannot cancel a purchase order that has already received stock." },
        };
    }

    if (po.status === "cancelled") {
        return {
            status: 400,
            body: { error: "This purchase order is already cancelled. " },
        }
    }

    const purchaseOrder = await prisma.purchaseOrder.update({
        where: { id: purchaseOrderId },
        data: { status: "cancelled" }
    });

    return { status: 200, body: { purchaseOrder } };
})

