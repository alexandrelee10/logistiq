// First feature 

import { prisma } from "@/app/lib/prisma";
import { register } from "@/app/lib/registry";

// Function for displaying all products 
register("listProducts", async(_data, ctx) => {
    const products = await prisma.product.findMany({
        where: { organizationId: ctx.organizationId }, // find products whose organization id matches mine 
    });

    return { status: 200, body: { products } };
});

// Create product 
register("createProduct", async (data, ctx) => {
    const product = await prisma.product.create({
        data: {
            organizationId: ctx.organizationId,
            sku: data.sku,
            name: data.name,
            reorderPoint: data.reorderPoint ?? 0,
            attributes: data.attributes ?? {},
        },
    });
    return { status: 201, body: { product } };
});