/*
  Warnings:

  - You are about to drop the column `poNumber` on the `PurchaseOrderLine` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[soNumber]` on the table `SalesOrder` will be added. If there are existing duplicate values, this will fail.
  - Made the column `poNumber` on table `PurchaseOrder` required. This step will fail if there are existing NULL values in that column.
  - Made the column `soNumber` on table `SalesOrder` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "PurchaseOrderLine_poNumber_key";

-- AlterTable
ALTER TABLE "PurchaseOrder" ALTER COLUMN "poNumber" SET NOT NULL;

-- AlterTable
ALTER TABLE "PurchaseOrderLine" DROP COLUMN "poNumber";

-- AlterTable
ALTER TABLE "SalesOrder" ALTER COLUMN "soNumber" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "SalesOrder_soNumber_key" ON "SalesOrder"("soNumber");
