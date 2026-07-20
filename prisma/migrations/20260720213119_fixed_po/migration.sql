-- AlterTable
ALTER TABLE "PurchaseOrder" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "status" "PurchaseOrderStatus" NOT NULL DEFAULT 'awaiting_approval';
