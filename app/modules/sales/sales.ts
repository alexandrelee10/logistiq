import { applyStockDelta, StockBelowZeroError } from "@/app/lib/inventory";
import { nextOrderNumber } from "@/app/lib/order-number";
import { prisma } from "@/app/lib/prisma";
import { register } from "@/app/lib/registry";
import { Prisma } from "@/generated/prisma/client";

// Create a customer --- 1.61s response time
register("createCustomer", async(data, ctx) => {
    const { name, email, phone } = data;

    if (!name) {
        return { status: 400, body: { error: "name is required" } };
    }

    const customer = await prisma.customer.create({
        data: {
            organizationId: ctx.organizationId,
            name,
            email: email ?? null,
            phone: phone ?? null
        },
    });
    return { status: 201, body: { customer } };
});

type SalesOrderLineInput = { productId: string, quantity: number, unitPrice: number }

// List all customers associated with an organization --- 1.71s response time
register("listCustomers", async(_data, ctx) => {
    const customers = await prisma.customer.findMany({
        where: { organizationId: ctx.organizationId }
    });
    return { status: 200, body: { customers } };
});

// Create a sales order --- 1.07s response time 
register("createSalesOrder", async(data , ctx) => {
    const { customerId, lines, dueDate } = data as {
        customerId: string;
        lines: SalesOrderLineInput;
        dueDate: string;
    };
    // Ensures customerId is valid and lines at least has one product and it is an array 
    if (!customerId || !Array.isArray(lines) || lines.length === 0) {
        return { status: 400, body: { error: "customerId and non-empty lines array are required." } };
    }
    // Loops through array / lines to ensure everything is valid 
    for (const line of lines) {
        if (!line.productId || typeof line.quantity !== "number" || line.quantity <= 0 || typeof line.unitPrice !== "number" || line.unitPrice < 0) {
            return { status: 400, body: { error: "Each line needs a productId, a positive quantity, and a non-negative unitPrice." } };
        };
    }

    // Search for customer that matches both in Id and organization 
    const customer = await prisma.customer.findFirst({
        where: { id: customerId, organizationId: ctx.organizationId }
    });
    if (!customer) {
        return { status: 404, body: { error: "Customer not found." } };
    }
    // grab only product Id's
    const productIds = lines.map((l) => l.productId);
    
    // find the products based on their id's
    const products = await prisma.product.findMany({
        where: { id: { in: productIds }, organizationId: ctx.organizationId }
    });

    // Ensure all products are found.
    // Set ensures no duplicates are counted
    if (products.length !== new Set(productIds).size) {
        return { status: 404, body: { error: "One or more products not found." } };
    }

    const salesOrder = await prisma.$transaction(async (tx) => {
        const soNumber = await nextOrderNumber(tx, ctx.organizationId, "SO");
        const so = await tx.salesOrder.create({
            data: {
                organizationId: ctx.organizationId,
                soNumber,
                customerId,
                status: "draft",
                dueDate: dueDate ? new Date(dueDate) : null,
            },
        });
        
        await tx.salesOrderLine.createMany({
            data: lines.map((l) => ({
                salesOrderId: so.id,
                productId: l.productId,
                quantityOrdered: l.quantity,
                unitPrice: l.unitPrice,
            })),
        });
        // Find this exact sales order. If it somehow doesn't exist, throw an error.
        return tx.salesOrder.findUniqueOrThrow({
            where: { id: so.id },
            include: { salesOrderLines: true, customer: true },
        });
    });

    return { status: 201, body: { salesOrder } };
});


// List Sales orders --- 1.22kb response time
register("listSalesOrders", async (data, ctx) => {
    const { status, unpaidOnly } = data;

    const salesOrders = await prisma.salesOrder.findMany({
        where: {
            organizationId: ctx.organizationId,
            ...(status ? { status } : {}),
        },
        include: { customer: true, salesOrderLines: { include: { product: true } } },
        orderBy: { createdAt: "desc" },
    });

    const withTotals = salesOrders.map((so) => {
        const amountTotal = so.salesOrderLines.reduce(
            (sum, l) => sum.plus(l.unitPrice.times(l.quantityOrdered)),
            new Prisma.Decimal(0)
        );
        const balanceDue = amountTotal.minus(so.amountPaid);

        return {
            ...so,
            amountTotal: amountTotal.toNumber(),
            balanceDue: balanceDue.toNumber(),
        };
    });

    const result = unpaidOnly ? withTotals.filter((so) => so.balanceDue > 0) : withTotals;

    return { status: 200, body: { salesOrders: result } };
});


// Confirm Sales Order --- 505ms response time 
register("confirmSalesOrder", async(data , ctx) => {
    const { salesOrderId } = data;
    
    const so = await prisma.salesOrder.findFirst({
        where: { id: salesOrderId, organizationId: ctx.organizationId },
    });

    if (!so) {
        return { status: 404, body: { error: "Sales order not found." } };
    }

    if (so.status !== "draft") {
        return { status: 400, body: { error: `Cannot confirm a sales order with status "${so.status}".`}}
    }

    const salesOrder = await prisma.salesOrder.update({
        where: { id: salesOrderId },
        data: { status: "confirmed" }
    });

    return { status: 200, body: { salesOrder } };
});

// Cancel Sales Order --- 111 ms response time
register("cancelSalesOrder", async(data , ctx) => {
    const { salesOrderId } = data;

    const so = await prisma.salesOrder.findUnique({
        where: { id: salesOrderId ,organizationId: ctx.organizationId }
    })

    if (!so) {
        return {
            status: 404,
            body: { erro: "Sales order not found" },
        };
    }

    if (so.status === "partially_fulfilled" || so.status === "fufilled") {
        return {
            status: 400,
            body: { error: "Cannot cancel a sales order that has already been shipped" },
        };
    }

    if (so.status === "cancelled") {
        return {
            status: 400,
            body: { error: "Sales order is already cancelled" },
        };
    }

    const salesOrder = await prisma.salesOrder.update({
        where: { id: salesOrderId, organizationId: ctx.organizationId },
        data: { status: "cancelled" }, 
    });

    return { status: 200, body: { salesOrder } };
})

// Fufill Sales Orders --- 1.32s response time 
register("fulfillSalesOrder", async (data, ctx) => {
    const { salesOrderId, warehouseId, fulfillments } = data;

    if (!salesOrderId || !warehouseId || !Array.isArray(fulfillments) || fulfillments.length === 0) {
        return {
            status: 400,
            body: { error: "salesOrderId, warehouseId, and a non-empty fulfillments array are required." },
        };
    }

    const [so, warehouse] = await Promise.all([
        prisma.salesOrder.findFirst({
            where: { id: salesOrderId, organizationId: ctx.organizationId },
            include: { salesOrderLines: true },
        }),
        prisma.warehouse.findFirst({ where: { id: warehouseId, organizationId: ctx.organizationId } }),
    ]);
    if (!so || !warehouse) {
        return { status: 404, body: { error: "Sales order or warehouse not found." } };
    }
    if (so.status === "draft") {
        return { status: 400, body: { error: "Confirm this sales order before fulfilling it." } };
    }
    if (so.status === "cancelled") {
        return { status: 400, body: { error: "This sales order has been cancelled." } };
    }
    if (so.status === "fulfilled") {
        return { status: 400, body: { error: "This sales order has already been fully fulfilled." } };
    }

    const linesById = new Map(so.salesOrderLines.map((l) => [l.id, l]));
    for (const f of fulfillments) {
        const line = linesById.get(f.lineId);
        if (!line) {
            return { status: 404, body: { error: `Line ${f.lineId} not found on this sales order.` } };
        }
        const remaining = line.quantityOrdered - line.quantityFufilled;
        if (typeof f.quantity !== "number" || f.quantity <= 0 || f.quantity > remaining) {
            return {
                status: 400,
                body: { error: `Line ${f.lineId} can fulfill at most ${remaining} more units.` },
            };
        }
    }

    try {
        const salesOrder = await prisma.$transaction(async (tx) => {
            for (const f of fulfillments) {
                const line = linesById.get(f.lineId)!;

                // Negative delta — this is the one line that actually differs from receivePurchaseOrder.
                await applyStockDelta(tx, line.productId, warehouseId, -f.quantity);
                await tx.inventoryRecord.create({
                    data: {
                        productId: line.productId,
                        warehouseId,
                        delta: -f.quantity,
                        reason: `sales order ${salesOrderId} fulfillment`,
                        userId: ctx.userId,
                    },
                });
                await tx.salesOrderLine.update({
                    where: { id: f.lineId },
                    data: { quantityFufilled: { increment: f.quantity } },
                });
            }

            const updatedLines = await tx.salesOrderLine.findMany({ where: { salesOrderId } });
            const fullyFulfilled = updatedLines.every((l) => l.quantityFufilled >= l.quantityOrdered);

            return tx.salesOrder.update({
                where: { id: salesOrderId },
                data: { status: fullyFulfilled ? "fulfilled" : "partially_fulfilled" },
                include: { salesOrderLines: true, customer: true },
            });
        });

        return { status: 200, body: { salesOrder } };
    } catch (err) {
        if (err instanceof StockBelowZeroError) {
            return { status: 400, body: { error: "Not enough stock to fulfill this order." } };
        }
        throw err;
    }
});

register("updateSalesOrderLine", async (data , ctx) => {
    const { salesOrderId, lineId, quantity, unitPrice } = data;

    if (!salesOrderId || !lineId) {
        return {
            status: 400,
            body: { error: "Sales order or line ID is required." },
        };
    }

    if (quantity === undefined && unitPrice === undefined) {
        return {
            status: 400,
            body: { error: "Provide a new quantity or unit price" },
        };
    }

    if (quantity !== undefined && (typeof quantity !== "number" || quantity <= 0)) {
        return {
            status: 400,
            body: { error: "Quantity must be a positive number" },
        };
    } 

    if (unitPrice !== undefined && (typeof unitPrice !== "number" || unitPrice < 0)) {
        return {
            status: 400,
            body: { error: "Unit price must be a non-negative number. " }
        };
    }

    const so = await prisma.salesOrder.findFirst({
        where: { id: salesOrderId, organizationId: ctx.organizationId }, 
        include: { salesOrderLines: true }
    });

    if (!so) {
        return {
            status: 404,
            body: { error: "Sales order not found."}
        };
    }

    if (so.status !== "draft") {
        return {
            status: 400,
            body: { error: `Cannot edit lines on a sales order with status "${so.status}". Only draft orders can be edited.`},
        };
    }

    const line = await so.salesOrderLines.find((l) => l.id === lineId);

    if (!line) {
        return {
            status: 404,
            body: { error: "Line not found on this sale order. " },
        };
    }


    const salesOrderLine = await prisma.salesOrderLine.update({
        where: { id: lineId },
        data: {
            ...(quantity !== undefined ? { quantityOrdered: quantity } : {}),
            ...(unitPrice !== undefined ? { unitPrice } : {}),
        }
    });

    return { status: 200, body: { salesOrderLine} };
})