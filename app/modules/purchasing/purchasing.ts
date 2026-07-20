import { prisma } from "@/app/lib/prisma";
import { register } from "@/app/lib/registry";
import { error } from "console";

register("createSupplier", async(data, ctx) => {
    const { name, email, phone } = data;

    if (!name) { 
        return { status: 400, body: { error:  "name is required" }}
    }

    const supplier = await prisma.supplier.create({
        data: {
            organizationId: ctx.organizationId,
            name,
            email: email ?? null, // change later to require it
            phone: phone ?? null
        },
    });

    return { status: 201, body: { supplier }};
});

register("listSuppliers", async (_data, ctx) => {
    const suppliers = await prisma.supplier.findMany({
        where: { organizationId: ctx.organizationId },
    });

    return { status: 200, body: { suppliers } };
});

type PurchaseOrderLineInput = { productId: string; quantity: number; unitCost?: number };

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
        const po = await tx.purchaseOrder.create({
            data: { organizationId: ctx.organizationId, supplierId, status: "awaiting_approval" },
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

