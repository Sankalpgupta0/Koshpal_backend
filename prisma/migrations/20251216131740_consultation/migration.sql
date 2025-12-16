/*
  Warnings:

  - You are about to drop the column `experienceYears` on the `CoachProfile` table. All the data in the column will be lost.
  - You are about to drop the column `rating` on the `CoachProfile` table. All the data in the column will be lost.
  - You are about to drop the column `specialization` on the `CoachProfile` table. All the data in the column will be lost.
  - You are about to drop the `Consultation` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('CONFIRMED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SlotStatus" AS ENUM ('AVAILABLE', 'BOOKED', 'BLOCKED');

-- DropForeignKey
ALTER TABLE "Consultation" DROP CONSTRAINT "Consultation_coachUserId_fkey";

-- DropForeignKey
ALTER TABLE "Consultation" DROP CONSTRAINT "Consultation_employeeUserId_fkey";

-- AlterTable
ALTER TABLE "CoachProfile" DROP COLUMN "experienceYears",
DROP COLUMN "rating",
DROP COLUMN "specialization",
ADD COLUMN     "bio" TEXT,
ADD COLUMN     "expertise" TEXT;

-- DropTable
DROP TABLE "Consultation";

-- CreateTable
CREATE TABLE "ConsultationBooking" (
    "id" TEXT NOT NULL,
    "slotId" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "meetingLink" TEXT NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'CONFIRMED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsultationBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoachSlot" (
    "id" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "status" "SlotStatus" NOT NULL DEFAULT 'AVAILABLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoachSlot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ConsultationBooking_slotId_key" ON "ConsultationBooking"("slotId");

-- CreateIndex
CREATE INDEX "CoachSlot_coachId_date_idx" ON "CoachSlot"("coachId", "date");

-- AddForeignKey
ALTER TABLE "ConsultationBooking" ADD CONSTRAINT "ConsultationBooking_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "CoachSlot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachSlot" ADD CONSTRAINT "CoachSlot_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "CoachProfile"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;
