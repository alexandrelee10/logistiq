import { prisma } from "@/app/lib/prisma";
import { register } from "@/app/lib/registry";
import { Prisma } from "@/generated/prisma/client";

// Record Payments --- 278ms response time
register("recordPayment", async (data, ctx) => {
    const { salesOrderId, amount, method } = data;

    if (!salesOrderId || typeof amount !== "number" || amount <= 0) {
        return { status: 400, body: { error: "salesOrderId and a positive numeric amount are required." } };
    }

    const so = await prisma.salesOrder.findFirst({
        where: { id: salesOrderId, organizationId: ctx.organizationId },
        include: { salesOrderLines: true },
    });
    if (!so) {
        return { status: 404, body: { error: "Sales order not found." } };
    }

    const amountTotal = so.salesOrderLines.reduce(
        (sum, l) => sum.plus(l.unitPrice.times(l.quantityOrdered)),
        new Prisma.Decimal(0)
    );
    const newAmountPaid = so.amountPaid.plus(amount);

    if (newAmountPaid.greaterThan(amountTotal)) {
        return {
            status: 400,
            body: { error: `That payment would overpay this order by ${newAmountPaid.minus(amountTotal).toFixed(2)}.` },
        };
    }

    const salesOrder = await prisma.$transaction(async (tx) => {
        await tx.payment.create({
            data: {
                salesOrderId,
                amount,
                method: method ?? null,
                userId: ctx.userId
            },
        });

        return tx.salesOrder.update({
            where: { id: salesOrderId },
            data: { amountPaid: newAmountPaid }
        })
    })

    return { status: 200, body: { salesOrder } };
});

// Refund payment --- 569ms response time 
register("refundPayment", async (data , ctx) => {
    const { salesOrderId, amount, method } = data;

    if (!salesOrderId || typeof amount !== "number" || amount <= 0) {
        return {
            status: 400,
            body: { error: "salesOrderId and a positive numeric amount are required."}
        };
    }

    const so = await prisma.salesOrder.findFirst({
        where: { id: salesOrderId, organizationId: ctx.organizationId },
    });

    if (!so) {
        return {
            status: 404,
            body: { error: "Sales order not found." }
        };
    }

    if (amount > so.amountPaid.toNumber()) {
        return {
            status: 400,
            body: { error: `Cannot refund more than the ${so.amountPaid.toFixed(2)} already paid.` }
        };
    }

    const newAmountPaid = so.amountPaid.minus(amount);

    const salesOrder = await prisma.$transaction(async (tx) => {
        await tx.payment.create({
            data: {
                salesOrderId,
                amount: new Prisma.Decimal(amount).negated(),
                method: method ?? null,
                userId: ctx.userId
            }
        });

        return tx.salesOrder.update({
            where: { id: salesOrderId },
            data: { amountPaid: newAmountPaid },
        });
    });

    return { status: 200, body: { salesOrder } };
})