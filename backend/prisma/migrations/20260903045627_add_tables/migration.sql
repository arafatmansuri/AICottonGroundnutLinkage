-- CreateEnum
CREATE TYPE "Role" AS ENUM ('FARMER', 'BUYER', 'ADMIN');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'PENDING');

-- CreateEnum
CREATE TYPE "BuyerVerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "CropQuality" AS ENUM ('GRADE_A', 'GRADE_B', 'GRADE_C', 'UNGRADED');

-- CreateEnum
CREATE TYPE "StorageStatus" AS ENUM ('NOT_STORED', 'IN_STORAGE', 'PARTIALLY_STORED');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('OFFER_CREATED', 'OFFER_SENT', 'ACCEPTED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED', 'CANCELLED', 'EXPIRED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('PRICE_ALERT', 'BUYER_MATCH', 'MARKET_ALERT', 'TRANSACTION_UPDATE', 'AI_RECOMMENDATION', 'SYSTEM');

-- CreateEnum
CREATE TYPE "RecommendationDecision" AS ENUM ('SELL_NOW', 'STORE', 'SELL_PARTIALLY', 'WAIT_AND_MONITOR');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "PriceTrend" AS ENUM ('INCREASING', 'DECREASING', 'STABLE', 'VOLATILE');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "language" TEXT NOT NULL DEFAULT 'en',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "farmer_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "village" TEXT,
    "taluka" TEXT,
    "district" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'Gujarat',
    "pincode" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "riskProfile" TEXT NOT NULL DEFAULT 'MODERATE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "farmer_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buyer_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'Gujarat',
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "verificationStatus" "BuyerVerificationStatus" NOT NULL DEFAULT 'PENDING',
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "rating" DOUBLE PRECISION DEFAULT 0,
    "totalTransactions" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "buyer_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crops" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameHi" TEXT,
    "nameGu" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "farmer_crops" (
    "id" TEXT NOT NULL,
    "farmerProfileId" TEXT NOT NULL,
    "cropId" TEXT NOT NULL,
    "totalQuantity" DOUBLE PRECISION NOT NULL,
    "availableQuantity" DOUBLE PRECISION NOT NULL,
    "soldQuantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL DEFAULT 'quintal',
    "quality" "CropQuality" NOT NULL DEFAULT 'UNGRADED',
    "harvestDate" TIMESTAMP(3),
    "storageStatus" "StorageStatus" NOT NULL DEFAULT 'NOT_STORED',
    "expectedPrice" DOUBLE PRECISION,
    "location" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "farmer_crops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mandis" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameHi" TEXT,
    "nameGu" TEXT,
    "district" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'Gujarat',
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mandis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "market_prices" (
    "id" TEXT NOT NULL,
    "mandiId" TEXT NOT NULL,
    "cropId" TEXT NOT NULL,
    "minPrice" DOUBLE PRECISION NOT NULL,
    "maxPrice" DOUBLE PRECISION NOT NULL,
    "modalPrice" DOUBLE PRECISION NOT NULL,
    "arrivalQty" DOUBLE PRECISION,
    "priceDate" TIMESTAMP(3) NOT NULL,
    "trend" "PriceTrend" NOT NULL DEFAULT 'STABLE',
    "priceChangePct" DOUBLE PRECISION,
    "source" TEXT NOT NULL DEFAULT 'MOCK',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "market_prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buyer_requirements" (
    "id" TEXT NOT NULL,
    "buyerProfileId" TEXT NOT NULL,
    "cropId" TEXT NOT NULL,
    "minQuantity" DOUBLE PRECISION NOT NULL,
    "maxQuantity" DOUBLE PRECISION NOT NULL,
    "quality" "CropQuality" NOT NULL DEFAULT 'GRADE_B',
    "offeredPrice" DOUBLE PRECISION NOT NULL,
    "district" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "buyer_requirements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buyer_offers" (
    "id" TEXT NOT NULL,
    "buyerProfileId" TEXT NOT NULL,
    "cropId" TEXT NOT NULL,
    "requirementId" TEXT,
    "offeredPrice" DOUBLE PRECISION NOT NULL,
    "minQuantity" DOUBLE PRECISION NOT NULL,
    "maxQuantity" DOUBLE PRECISION NOT NULL,
    "quality" "CropQuality" NOT NULL DEFAULT 'GRADE_B',
    "district" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'Gujarat',
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "buyer_offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buyer_verifications" (
    "id" TEXT NOT NULL,
    "buyerProfileId" TEXT NOT NULL,
    "status" "BuyerVerificationStatus" NOT NULL DEFAULT 'PENDING',
    "documentType" TEXT,
    "documentNumber" TEXT,
    "notes" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "buyer_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "farmerProfileId" TEXT NOT NULL,
    "buyerProfileId" TEXT NOT NULL,
    "farmerCropId" TEXT NOT NULL,
    "buyerOfferId" TEXT,
    "quantity" DOUBLE PRECISION NOT NULL,
    "agreedPrice" DOUBLE PRECISION NOT NULL,
    "transportCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "storageCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "platformFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netRealization" DOUBLE PRECISION NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'OFFER_CREATED',
    "statusHistory" JSONB NOT NULL DEFAULT '[]',
    "notes" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quality_assessments" (
    "id" TEXT NOT NULL,
    "farmerCropId" TEXT NOT NULL,
    "estimatedGrade" "CropQuality" NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "priceRangeMin" DOUBLE PRECISION NOT NULL,
    "priceRangeMax" DOUBLE PRECISION NOT NULL,
    "observations" JSONB NOT NULL DEFAULT '[]',
    "imageUrl" TEXT,
    "aiProvider" TEXT NOT NULL DEFAULT 'MOCK',
    "warning" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quality_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_recommendations" (
    "id" TEXT NOT NULL,
    "farmerCropId" TEXT,
    "userId" TEXT NOT NULL,
    "decision" "RecommendationDecision" NOT NULL,
    "recommendedSellQty" DOUBLE PRECISION,
    "recommendedHoldQty" DOUBLE PRECISION,
    "confidence" DOUBLE PRECISION NOT NULL,
    "riskLevel" "RiskLevel" NOT NULL DEFAULT 'MEDIUM',
    "reasoning" JSONB NOT NULL DEFAULT '[]',
    "explanation" TEXT,
    "agentsUsed" JSONB NOT NULL DEFAULT '[]',
    "inputContext" JSONB NOT NULL DEFAULT '{}',
    "dataTimestamp" TIMESTAMP(3) NOT NULL,
    "aiProvider" TEXT NOT NULL DEFAULT 'MOCK',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_requests" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "intent" TEXT,
    "agentsUsed" JSONB NOT NULL DEFAULT '[]',
    "response" TEXT,
    "executionMs" INTEGER,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "messages" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "changes" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "storage_options" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "costPerUnit" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'quintal/month',
    "available" BOOLEAN NOT NULL DEFAULT true,
    "capacity" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "storage_options_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE UNIQUE INDEX "farmer_profiles_userId_key" ON "farmer_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "buyer_profiles_userId_key" ON "buyer_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "admin_profiles_userId_key" ON "admin_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "crops_name_key" ON "crops"("name");

-- CreateIndex
CREATE INDEX "farmer_crops_farmerProfileId_idx" ON "farmer_crops"("farmerProfileId");

-- CreateIndex
CREATE INDEX "farmer_crops_cropId_idx" ON "farmer_crops"("cropId");

-- CreateIndex
CREATE INDEX "market_prices_cropId_idx" ON "market_prices"("cropId");

-- CreateIndex
CREATE INDEX "market_prices_mandiId_idx" ON "market_prices"("mandiId");

-- CreateIndex
CREATE INDEX "market_prices_priceDate_idx" ON "market_prices"("priceDate");

-- CreateIndex
CREATE INDEX "buyer_requirements_cropId_idx" ON "buyer_requirements"("cropId");

-- CreateIndex
CREATE INDEX "buyer_requirements_buyerProfileId_idx" ON "buyer_requirements"("buyerProfileId");

-- CreateIndex
CREATE INDEX "buyer_offers_cropId_idx" ON "buyer_offers"("cropId");

-- CreateIndex
CREATE INDEX "buyer_offers_buyerProfileId_idx" ON "buyer_offers"("buyerProfileId");

-- CreateIndex
CREATE INDEX "buyer_offers_isActive_idx" ON "buyer_offers"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "buyer_verifications_buyerProfileId_key" ON "buyer_verifications"("buyerProfileId");

-- CreateIndex
CREATE INDEX "transactions_farmerProfileId_idx" ON "transactions"("farmerProfileId");

-- CreateIndex
CREATE INDEX "transactions_buyerProfileId_idx" ON "transactions"("buyerProfileId");

-- CreateIndex
CREATE INDEX "transactions_status_idx" ON "transactions"("status");

-- CreateIndex
CREATE INDEX "ai_requests_userId_idx" ON "ai_requests"("userId");

-- CreateIndex
CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");

-- AddForeignKey
ALTER TABLE "farmer_profiles" ADD CONSTRAINT "farmer_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buyer_profiles" ADD CONSTRAINT "buyer_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_profiles" ADD CONSTRAINT "admin_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "farmer_crops" ADD CONSTRAINT "farmer_crops_farmerProfileId_fkey" FOREIGN KEY ("farmerProfileId") REFERENCES "farmer_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "farmer_crops" ADD CONSTRAINT "farmer_crops_cropId_fkey" FOREIGN KEY ("cropId") REFERENCES "crops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "market_prices" ADD CONSTRAINT "market_prices_mandiId_fkey" FOREIGN KEY ("mandiId") REFERENCES "mandis"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "market_prices" ADD CONSTRAINT "market_prices_cropId_fkey" FOREIGN KEY ("cropId") REFERENCES "crops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buyer_requirements" ADD CONSTRAINT "buyer_requirements_buyerProfileId_fkey" FOREIGN KEY ("buyerProfileId") REFERENCES "buyer_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buyer_requirements" ADD CONSTRAINT "buyer_requirements_cropId_fkey" FOREIGN KEY ("cropId") REFERENCES "crops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buyer_offers" ADD CONSTRAINT "buyer_offers_buyerProfileId_fkey" FOREIGN KEY ("buyerProfileId") REFERENCES "buyer_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buyer_offers" ADD CONSTRAINT "buyer_offers_cropId_fkey" FOREIGN KEY ("cropId") REFERENCES "crops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buyer_offers" ADD CONSTRAINT "buyer_offers_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "buyer_requirements"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buyer_verifications" ADD CONSTRAINT "buyer_verifications_buyerProfileId_fkey" FOREIGN KEY ("buyerProfileId") REFERENCES "buyer_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_farmerProfileId_fkey" FOREIGN KEY ("farmerProfileId") REFERENCES "farmer_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_buyerProfileId_fkey" FOREIGN KEY ("buyerProfileId") REFERENCES "buyer_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_farmerCropId_fkey" FOREIGN KEY ("farmerCropId") REFERENCES "farmer_crops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_buyerOfferId_fkey" FOREIGN KEY ("buyerOfferId") REFERENCES "buyer_offers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_assessments" ADD CONSTRAINT "quality_assessments_farmerCropId_fkey" FOREIGN KEY ("farmerCropId") REFERENCES "farmer_crops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_recommendations" ADD CONSTRAINT "ai_recommendations_farmerCropId_fkey" FOREIGN KEY ("farmerCropId") REFERENCES "farmer_crops"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_requests" ADD CONSTRAINT "ai_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
