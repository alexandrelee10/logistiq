import { prisma } from "@/app/lib/prisma";
import { register } from "@/app/lib/registry";
import { Prisma } from "@/generated/prisma/client";

const REVENUE_STATUSES = ["confirmed", "partially_fulfilled", "fulfilled"];

// Find the top customers --- 1.29s response time 
register("topCustomers", async (data, ctx) => {
    const { limit } = data;
    const take = typeof limit === "number" && limit > 0 ? limit : 5;

    const customers = await prisma.customer.findMany({
        where: { organizationId: ctx.organizationId },
        include: {
            salesOrders: {
                where: { status: { in: REVENUE_STATUSES } },
                include: { salesOrderLines: true },
            },
        },
    });

    const ranked = customers
        .map((c) => {
            const totalRevenue = c.salesOrders.reduce((customerSum, so) => {
                const orderTotal = so.salesOrderLines.reduce(
                    (sum, l) => sum.plus(l.unitPrice.times(l.quantityOrdered)),
                    new Prisma.Decimal(0)
                );
                return customerSum.plus(orderTotal);
            }, new Prisma.Decimal(0));

            const { salesOrders, ...customer } = c;
            return { ...customer, totalRevenue: totalRevenue.toNumber() };
        })
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, take);

    return { status: 200, body: { customers: ranked } };
});

// Finds the revenue by days --- 329s response time with standard 30 window days
register("revenueByDay", async (data, ctx) => {
    const { days } = data;
    const windowDays = typeof days === "number" && days > 0 ? days : 30;

    const since = new Date();
    since.setDate(since.getDate() - (windowDays - 1));
    since.setHours(0, 0, 0, 0);

    const salesOrders = await prisma.salesOrder.findMany({
        where: {
            organizationId: ctx.organizationId,
            status: { in: REVENUE_STATUSES },
            createdAt: { gte: since },
        },
        include: { salesOrderLines: true },
    });

    // Seed every day in the window at zero first, so a day with no orders
    // still shows up as $0 in the response — not a gap the chart has to
    // guess how to fill.
    const totalsByDay = new Map<string, Prisma.Decimal>();
    for (let i = 0; i < windowDays; i++) {
        const d = new Date(since);
        d.setDate(d.getDate() + i);
        totalsByDay.set(d.toISOString().slice(0, 10), new Prisma.Decimal(0));
    }

    for (const so of salesOrders) {
        const day = so.createdAt.toISOString().slice(0, 10);
        const orderTotal = so.salesOrderLines.reduce(
            (sum, l) => sum.plus(l.unitPrice.times(l.quantityOrdered)),
            new Prisma.Decimal(0)
        );
        const existing = totalsByDay.get(day) ?? new Prisma.Decimal(0);
        totalsByDay.set(day, existing.plus(orderTotal));
    }

    const series = Array.from(totalsByDay.entries()).map(([date, total]) => ({
        date,
        total: total.toNumber(),
    }));

    return { status: 200, body: { series } };
});

register("topProducts", async (data, ctx) => {
    const { limit } = data;
    const take = typeof limit === "number" && limit > 0 ? limit : 5;

    const products = await prisma.product.findMany({
        where: { organizationId: ctx.organizationId },
        include: {
            salesOrderLines: {
                where: { salesOrder: { status: { in: REVENUE_STATUSES } } },
            },
        },
    });

    const ranked = products
        .map((p) => {
            const unitsSold = p.salesOrderLines.reduce((sum, l) => sum + l.quantityOrdered, 0);
            const { salesOrderLines, ...product } = p;
            return { ...product, unitsSold };
        })
        .sort((a, b) => b.unitsSold - a.unitsSold)
        .slice(0, take);

    return { status: 200, body: { products: ranked } };
});