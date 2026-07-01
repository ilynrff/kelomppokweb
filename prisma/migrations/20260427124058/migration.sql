/*
  Warnings:

  - You are about to drop the column `image` on the `Court` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[bookingCode]` on the table `Booking` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "BookingStatus" ADD VALUE 'CHECKED_IN';
ALTER TYPE "BookingStatus" ADD VALUE 'COMPLETED';
ALTER TYPE "BookingStatus" ADD VALUE 'RESCHEDULE_REQUESTED';
ALTER TYPE "BookingStatus" ADD VALUE 'RESCHEDULE_APPROVED';
ALTER TYPE "BookingStatus" ADD VALUE 'RESCHEDULE_REJECTED';

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "bookingCode" TEXT,
ADD COLUMN     "rescheduleDate" TIMESTAMP(3),
ADD COLUMN     "rescheduleEndTime" INTEGER,
ADD COLUMN     "rescheduleNote" TEXT,
ADD COLUMN     "rescheduleStartTime" INTEGER;

-- AlterTable
ALTER TABLE "Court" DROP COLUMN "image",
ADD COLUMN     "images" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateIndex
CREATE UNIQUE INDEX "Booking_bookingCode_key" ON "Booking"("bookingCode");
