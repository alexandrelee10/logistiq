import { prisma } from "@/app/lib/prisma";
import { register } from "@/app/lib/registry";

// List all warehouses associated with organizationId 
register("listWarehouse", async (_data, ctx) => {
    const warehouses = await prisma.warehouse.findMany({
        where: { organizationId: ctx.organizationId }
    });
    return { status: 200, body: { warehouses } }
});

// Create a warehouse for that organization 
register("createWarehouse", async (data, ctx) => {
    const { name, code } = data;

    if (!name || !code) {
        return { status: 400, body: { error: "name and code are required" } }
    } 

    const warehouse = await prisma.warehouse.create({
        data: {
            organizationId: ctx.organizationId,
            name,
            code,
        }
    });
    return { status: 201, body: { warehouse } };
})