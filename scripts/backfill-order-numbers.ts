import { prisma } from "@/app/lib/prisma";
import { nextOrderNumber } from "@/app/lib/order-number";

async function backfill() {
    const organizations = await prisma.organization.findMany({ select: { id: true } });

    for (const org of organizations) {
        // Purchase Orders 
        const purchaseOrders = await prisma.purchaseOrder.findMany({
            where: { organizationId: org.id, poNumber: null },
            orderBy: { createdAt: "asc" },
        });
        for (const po of purchaseOrders) {
            const poNumber = await prisma.$transaction(async (tx) => {
                const poNumber = await nextOrderNumber(tx, org.id, "PO");
                await tx.purchaseOrder.update({ where: { id: po.id }, data: { poNumber } });
                return poNumber;
            });
            console.log(`purchaseOrder ${po.id} -> ${poNumber}`);
        }

        // Sales Orders 
        const salesOrders = await prisma.salesOrder.findMany({
            where: { organizationId: org.id, soNumber: null },
            orderBy: { createdAt: "asc" },
        });
        for (const so of salesOrders) {
            const soNumber = await prisma.$transaction(async (tx) => {
                const soNumber = await nextOrderNumber(tx, org.id, "SO");
                await tx.salesOrder.update({ where: { id: so.id }, data: { soNumber } });
                return soNumber;
            });
            console.log(`salesOrder ${so.id} -> ${soNumber}`);
        }
    }

    console.log("Backfill complete.");
}

backfill()
    .then(() => process.exit(0))
    .catch((err) => { // Testing
        console.error(err);
        process.exit(1);
    });


/**
 * 
 * Ensures all PO's and SO's have PO's and are accounted for
 * 
 * This script is a one-time migration tool. You placed it in your scripts folder because it's not part of your app's normal operation—it's something you run manually when 
 * you need to fix existing data. It goes through every organization, finds all purchase orders and sales orders that are missing order numbers, processes them from oldest to newest, 
 * generates the next available number using nextOrderNumber(), saves that number to the database inside a transaction, and then exits once every missing order has been updated. After running it 
 * once, your old data is brought up to the same standard as newly created orders.
 * 
 */