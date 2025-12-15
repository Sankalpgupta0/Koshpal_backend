/*
  Warnings:

  - You are about to drop the column `uploadedAt` on the `EmployeeUploadBatch` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "UploadStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- AlterTable
ALTER TABLE "EmployeeUploadBatch" DROP COLUMN "uploadedAt",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "status" "UploadStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "totalRecords" SET DEFAULT 0,
ALTER COLUMN "successRecords" SET DEFAULT 0,
ALTER COLUMN "failedRecords" SET DEFAULT 0;

-- CreateIndex
CREATE INDEX "EmployeeUploadBatch_companyId_idx" ON "EmployeeUploadBatch"("companyId");

-- CreateIndex
CREATE INDEX "EmployeeUploadBatch_hrUserId_idx" ON "EmployeeUploadBatch"("hrUserId");
