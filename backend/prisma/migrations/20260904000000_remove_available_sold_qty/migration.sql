-- Migration: remove availableQuantity and soldQuantity, rename totalQuantity -> quantity
-- Add new quantity column populated from totalQuantity
ALTER TABLE "farmer_crops" ADD COLUMN "quantity" DOUBLE PRECISION;
UPDATE "farmer_crops" SET "quantity" = "totalQuantity";
ALTER TABLE "farmer_crops" ALTER COLUMN "quantity" SET NOT NULL;

-- Drop old columns
ALTER TABLE "farmer_crops" DROP COLUMN "totalQuantity";
ALTER TABLE "farmer_crops" DROP COLUMN "availableQuantity";
ALTER TABLE "farmer_crops" DROP COLUMN "soldQuantity";
