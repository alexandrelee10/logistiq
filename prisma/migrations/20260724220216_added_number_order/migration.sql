/*
  Warnings:

  - A unique constraint covering the columns `[poNumber]` on the table `PurchaseOrderLine` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[soNumber]` on the table `SalesOrder` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "PurchaseOrderLine" ADD COLUMN     "poNumber" TEXT;

-- AlterTable
ALTER TABLE "SalesOrder" ADD COLUMN     "soNumber" TEXT;

-- CreateTable
CREATE TABLE "OrderSequence" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "lastNumber" INTEGER NOT NULL DEFAULT 1000,

    CONSTRAINT "OrderSequence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrderSequence_organizationId_type_key" ON "OrderSequence"("organizationId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseOrderLine_poNumber_key" ON "PurchaseOrderLine"("poNumber");

-- CreateIndex
CREATE UNIQUE INDEX "SalesOrder_soNumber_key" ON "SalesOrder"("soNumber");

-- AddForeignKey
ALTER TABLE "OrderSequence" ADD CONSTRAINT "OrderSequence_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
