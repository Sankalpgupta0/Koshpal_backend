/*
  Warnings:

  - Added the required column `companyId` to the `Account` table without a default value. This is not possible if the table is not empty.
  - Added the required column `categoryBreakdown` to the `MonthlySummary` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `MonthlySummary` table without a default value. This is not possible if the table is not empty.
  - Added the required column `periodEnd` to the `MonthlySummary` table without a default value. This is not possible if the table is not empty.
  - Added the required column `periodStart` to the `MonthlySummary` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `source` to the `Transaction` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TransactionSource" AS ENUM ('MANUAL', 'MOBILE', 'BANK');

-- DropIndex
DROP INDEX "Transaction_transactionDate_idx";

-- DropIndex
DROP INDEX "Transaction_userId_idx";

-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "companyId" TEXT NOT NULL,
ADD COLUMN     "employeeUserId" TEXT;

-- AlterTable
ALTER TABLE "MonthlySummary" ADD COLUMN     "categoryBreakdown" JSONB NOT NULL,
ADD COLUMN     "companyId" TEXT NOT NULL,
ADD COLUMN     "periodEnd" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "periodStart" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "companyId" TEXT NOT NULL,
ADD COLUMN     "source" "TransactionSource" NOT NULL,
ADD COLUMN     "subCategory" TEXT;

-- CreateIndex
CREATE INDEX "Account_companyId_idx" ON "Account"("companyId");

-- CreateIndex
CREATE INDEX "MonthlySummary_companyId_idx" ON "MonthlySummary"("companyId");

-- CreateIndex
CREATE INDEX "Transaction_userId_transactionDate_idx" ON "Transaction"("userId", "transactionDate");

-- CreateIndex
CREATE INDEX "Transaction_companyId_idx" ON "Transaction"("companyId");
