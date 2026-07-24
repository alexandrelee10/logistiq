import { Prisma } from "@/generated/prisma/client";

export async function nextOrderNumber(
 tx: Prisma.TransactionClient,
 organizationId: string,
 type: "PO" | "SO"
): Promise<string> {
 const sequence = await tx.orderSequence.upsert({
 where: { organizationId_type: { organizationId, type } },
 create: { organizationId, type, lastNumber: 1001 },
 update: { lastNumber: { increment: 1 } },
 });
 return `${type}-${sequence.lastNumber}`;
}

// If it's the first time that company has created that type of order, it 
// creates a new dispenser starting at 1001. If the dispenser already exists, 
// it safely increases the number by one. Finally, it formats the result into 
// something like "PO-1008" or "SO-1042" and returns it so the new order has a 
// unique, sequential order number