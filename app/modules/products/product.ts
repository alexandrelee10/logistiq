// First feature 

import { prisma } from "@/app/lib/prisma";
import { register } from "@/app/lib/registry";

// Function for displaying all products
register("listProducts", async(_data, ctx) => {
    const products = await prisma.product.findMany({
        where: { organizationId: ctx.organizationId }, // find products whose organization id matches mine
        orderBy: { createdAt: "desc" },
        include: { category: { select: { id: true, name: true } } },
    });

    return { status: 200, body: { products } };
});

// Get a single product (detail page)
register("getProduct", async (data, ctx) => {
    const { productId } = data;

    if (!productId) {
        return { status: 400, body: { error: "productId is required" } };
    }

    const product = await prisma.product.findFirst({
        where: { id: productId, organizationId: ctx.organizationId },
        include: { category: { select: { id: true, name: true } } },
    });

    if (!product) {
        return { status: 404, body: { error: "Product not found" } };
    }

    return { status: 200, body: { product } };
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
            categoryId: data.categoryId ?? null,
            price: data.price ?? null,
        },
        include: { category: { select: { id: true, name: true } } },
    });
    return { status: 201, body: { product } };
});

// List categories for the org's product-category dropdown/filter
register("listCategories", async (_data, ctx) => {
    const categories = await prisma.category.findMany({
        where: { organizationId: ctx.organizationId },
        orderBy: { name: "asc" },
    });
    return { status: 200, body: { categories } };
});

// Create a category
register("createCategory", async (data, ctx) => {
    const { name } = data;

    if (!name) {
        return { status: 400, body: { error: "name is required" } };
    }

    const category = await prisma.category.create({
        data: { organizationId: ctx.organizationId, name },
    });

    return { status: 201, body: { category } };
});