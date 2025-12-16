/*
  Warnings:

  - The `expertise` column on the `CoachProfile` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `fullName` to the `CoachProfile` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CoachProfile" ADD COLUMN     "clientsHelped" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "fullName" TEXT NOT NULL,
ADD COLUMN     "languages" TEXT[],
ADD COLUMN     "location" TEXT,
ADD COLUMN     "profilePhoto" TEXT,
ADD COLUMN     "rating" DECIMAL(3,2) NOT NULL DEFAULT 0,
ADD COLUMN     "successRate" INTEGER NOT NULL DEFAULT 0,
DROP COLUMN "expertise",
ADD COLUMN     "expertise" TEXT[];
