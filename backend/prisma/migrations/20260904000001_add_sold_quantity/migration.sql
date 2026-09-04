-- Add soldQuantity column back to farmer_crops with default 0
ALTER TABLE "farmer_crops" ADD COLUMN "soldQuantity" DOUBLE PRECISION NOT NULL DEFAULT 0;
