/*
  Warnings:

  - The values [DRIVER,BROKER,DRIVERLEADER,MAINTENANCE,DISPATCH,FLEET,COMPLIANCE] on the enum `USERROLE` will be removed. If these variants are still used in the database, this will fail.
  - Added the required column `organizationId` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "USERROLE_new" AS ENUM ('ADMIN', 'MANAGER', 'WAREHOUSE_STAFF', 'PURCHASING', 'ACCOUNTING', 'VIEWER');
ALTER TABLE "User" ALTER COLUMN "role" TYPE "USERROLE_new" USING ("role"::text::"USERROLE_new");
ALTER TYPE "USERROLE" RENAME TO "USERROLE_old";
ALTER TYPE "USERROLE_new" RENAME TO "USERROLE";
DROP TYPE "public"."USERROLE_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "Session" DROP CONSTRAINT "Session_userId_fkey";

-- DropIndex
DROP INDEX "User_id_key";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "organizationId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
