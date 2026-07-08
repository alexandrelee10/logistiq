/*
  Warnings:

  - The values [MAINTNANCE] on the enum `USERROLE` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "USERROLE_new" AS ENUM ('DRIVER', 'BROKER', 'DRIVERLEADER', 'MAINTENANCE', 'DISPATCH', 'FLEET', 'COMPLIANCE', 'ACCOUNTING');
ALTER TABLE "User" ALTER COLUMN "role" TYPE "USERROLE_new" USING ("role"::text::"USERROLE_new");
ALTER TYPE "USERROLE" RENAME TO "USERROLE_old";
ALTER TYPE "USERROLE_new" RENAME TO "USERROLE";
DROP TYPE "public"."USERROLE_old";
COMMIT;
