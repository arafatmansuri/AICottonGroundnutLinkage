-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'PAYMENT_RECEIVED';
ALTER TYPE "NotificationType" ADD VALUE 'CROP_INTEREST';

-- CreateTable
CREATE TABLE "crop_interest_notifications" (
    "id" TEXT NOT NULL,
    "buyerProfileId" TEXT NOT NULL,
    "farmerCropId" TEXT NOT NULL,
    "message" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crop_interest_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "crop_interest_notifications_buyerProfileId_idx" ON "crop_interest_notifications"("buyerProfileId");

-- CreateIndex
CREATE INDEX "crop_interest_notifications_farmerCropId_idx" ON "crop_interest_notifications"("farmerCropId");

-- AddForeignKey
ALTER TABLE "crop_interest_notifications" ADD CONSTRAINT "crop_interest_notifications_buyerProfileId_fkey" FOREIGN KEY ("buyerProfileId") REFERENCES "buyer_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crop_interest_notifications" ADD CONSTRAINT "crop_interest_notifications_farmerCropId_fkey" FOREIGN KEY ("farmerCropId") REFERENCES "farmer_crops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
