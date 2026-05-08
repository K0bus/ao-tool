-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MODERATOR', 'USER');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION');

-- CreateEnum
CREATE TYPE "ItemType" AS ENUM ('WEAPON', 'OFF_HAND', 'ARMOR_HEAD', 'ARMOR_CHEST', 'ARMOR_SHOES', 'BAG', 'CAPE', 'MOUNT', 'CONSUMABLE', 'RESOURCE_RAW', 'RESOURCE_REFINED', 'PRODUCT', 'FARMABLE', 'FURNITURE', 'JOURNAL', 'LABORER', 'OTHER');

-- CreateEnum
CREATE TYPE "LocationType" AS ENUM ('ROYAL_CITY', 'BLACK_ZONE_CITY', 'OUTLAND_CITY', 'PORTAL_CITY', 'OTHER');

-- CreateEnum
CREATE TYPE "ImportType" AS ENUM ('FULL', 'PARTIAL_ITEMS', 'PARTIAL_RECIPES', 'ICONS_SYNC', 'REINDEX');

-- CreateEnum
CREATE TYPE "ImportStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCESS', 'FAILED', 'PARTIAL_SUCCESS');

-- CreateEnum
CREATE TYPE "LogLevel" AS ENUM ('DEBUG', 'INFO', 'WARN', 'ERROR');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "status" "UserStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerifyToken" TEXT,
    "emailVerifyExpires" TIMESTAMP(3),
    "resetPasswordToken" TEXT,
    "resetPasswordExpires" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "lastLoginIp" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "parentId" TEXT,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Item" (
    "id" TEXT NOT NULL,
    "uniqueName" TEXT NOT NULL,
    "tier" INTEGER NOT NULL,
    "enchantmentLevel" INTEGER NOT NULL DEFAULT 0,
    "shopCategory" TEXT,
    "shopSubcategory" TEXT,
    "itemType" "ItemType" NOT NULL DEFAULT 'OTHER',
    "categoryId" TEXT,
    "weight" DOUBLE PRECISION,
    "maxStackSize" INTEGER,
    "canBeOvercharged" BOOLEAN NOT NULL DEFAULT false,
    "isCraftable" BOOLEAN NOT NULL DEFAULT false,
    "isRefinable" BOOLEAN NOT NULL DEFAULT false,
    "iconUrl" TEXT,
    "iconLocalPath" TEXT,
    "iconFetched" BOOLEAN NOT NULL DEFAULT false,
    "iconFetchedAt" TIMESTAMP(3),
    "baseItemId" TEXT,
    "dataHash" TEXT,
    "importedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemLocalization" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "ItemLocalization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CraftingStation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "maxLevel" INTEGER NOT NULL DEFAULT 3,

    CONSTRAINT "CraftingStation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CraftingRecipe" (
    "id" TEXT NOT NULL,
    "resultItemId" TEXT NOT NULL,
    "craftingStationId" TEXT,
    "resultCount" INTEGER NOT NULL DEFAULT 1,
    "craftingFame" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "silverCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "canBeOvercharged" BOOLEAN NOT NULL DEFAULT false,
    "focusable" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "CraftingRecipe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CraftingIngredient" (
    "id" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "maxReturnRate" DOUBLE PRECISION,

    CONSTRAINT "CraftingIngredient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefiningRecipe" (
    "id" TEXT NOT NULL,
    "resultItemId" TEXT NOT NULL,
    "craftingStationId" TEXT,
    "resultCount" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "RefiningRecipe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefiningIngredient" (
    "id" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "maxReturnRate" DOUBLE PRECISION,

    CONSTRAINT "RefiningIngredient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "LocationType" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CityItemBonus" (
    "id" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "craftingBonus" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "refiningBonus" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "CityItemBonus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReturnRate" (
    "id" TEXT NOT NULL,
    "tier" INTEGER NOT NULL,
    "enchantmentLevel" INTEGER NOT NULL DEFAULT 0,
    "baseReturnRate" DOUBLE PRECISION NOT NULL,
    "focusReturnRate" DOUBLE PRECISION NOT NULL,
    "cityBonusRate" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "ReturnRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportJob" (
    "id" TEXT NOT NULL,
    "type" "ImportType" NOT NULL,
    "status" "ImportStatus" NOT NULL DEFAULT 'PENDING',
    "triggeredById" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "durationMs" INTEGER,
    "itemsProcessed" INTEGER NOT NULL DEFAULT 0,
    "itemsCreated" INTEGER NOT NULL DEFAULT 0,
    "itemsUpdated" INTEGER NOT NULL DEFAULT 0,
    "itemsSkipped" INTEGER NOT NULL DEFAULT 0,
    "itemsFailed" INTEGER NOT NULL DEFAULT 0,
    "sourceCommit" TEXT,
    "sourceUrl" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImportJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportLog" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "level" "LogLevel" NOT NULL DEFAULT 'INFO',
    "message" TEXT NOT NULL,
    "context" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImportLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "targetType" TEXT,
    "targetId" TEXT,
    "before" JSONB,
    "after" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemConfig" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "description" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT,

    CONSTRAINT "SystemConfig_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_emailVerifyToken_key" ON "User"("emailVerifyToken");

-- CreateIndex
CREATE UNIQUE INDEX "User_resetPasswordToken_key" ON "User"("resetPasswordToken");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_username_idx" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "User"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_token_idx" ON "Session"("token");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE INDEX "Category_parentId_idx" ON "Category"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "Item_uniqueName_key" ON "Item"("uniqueName");

-- CreateIndex
CREATE INDEX "Item_tier_idx" ON "Item"("tier");

-- CreateIndex
CREATE INDEX "Item_enchantmentLevel_idx" ON "Item"("enchantmentLevel");

-- CreateIndex
CREATE INDEX "Item_tier_enchantmentLevel_idx" ON "Item"("tier", "enchantmentLevel");

-- CreateIndex
CREATE INDEX "Item_categoryId_idx" ON "Item"("categoryId");

-- CreateIndex
CREATE INDEX "Item_itemType_idx" ON "Item"("itemType");

-- CreateIndex
CREATE INDEX "Item_shopCategory_idx" ON "Item"("shopCategory");

-- CreateIndex
CREATE INDEX "Item_baseItemId_idx" ON "Item"("baseItemId");

-- CreateIndex
CREATE INDEX "Item_isCraftable_idx" ON "Item"("isCraftable");

-- CreateIndex
CREATE INDEX "Item_isRefinable_idx" ON "Item"("isRefinable");

-- CreateIndex
CREATE INDEX "Item_iconFetched_idx" ON "Item"("iconFetched");

-- CreateIndex
CREATE INDEX "ItemLocalization_itemId_idx" ON "ItemLocalization"("itemId");

-- CreateIndex
CREATE INDEX "ItemLocalization_locale_idx" ON "ItemLocalization"("locale");

-- CreateIndex
CREATE INDEX "ItemLocalization_name_idx" ON "ItemLocalization"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ItemLocalization_itemId_locale_key" ON "ItemLocalization"("itemId", "locale");

-- CreateIndex
CREATE INDEX "CraftingStation_type_idx" ON "CraftingStation"("type");

-- CreateIndex
CREATE UNIQUE INDEX "CraftingRecipe_resultItemId_key" ON "CraftingRecipe"("resultItemId");

-- CreateIndex
CREATE INDEX "CraftingRecipe_craftingStationId_idx" ON "CraftingRecipe"("craftingStationId");

-- CreateIndex
CREATE INDEX "CraftingIngredient_recipeId_idx" ON "CraftingIngredient"("recipeId");

-- CreateIndex
CREATE INDEX "CraftingIngredient_itemId_idx" ON "CraftingIngredient"("itemId");

-- CreateIndex
CREATE UNIQUE INDEX "RefiningRecipe_resultItemId_key" ON "RefiningRecipe"("resultItemId");

-- CreateIndex
CREATE INDEX "RefiningRecipe_craftingStationId_idx" ON "RefiningRecipe"("craftingStationId");

-- CreateIndex
CREATE INDEX "RefiningIngredient_recipeId_idx" ON "RefiningIngredient"("recipeId");

-- CreateIndex
CREATE INDEX "RefiningIngredient_itemId_idx" ON "RefiningIngredient"("itemId");

-- CreateIndex
CREATE INDEX "Location_type_idx" ON "Location"("type");

-- CreateIndex
CREATE INDEX "CityItemBonus_locationId_idx" ON "CityItemBonus"("locationId");

-- CreateIndex
CREATE INDEX "CityItemBonus_itemId_idx" ON "CityItemBonus"("itemId");

-- CreateIndex
CREATE UNIQUE INDEX "CityItemBonus_locationId_itemId_key" ON "CityItemBonus"("locationId", "itemId");

-- CreateIndex
CREATE INDEX "ReturnRate_tier_idx" ON "ReturnRate"("tier");

-- CreateIndex
CREATE UNIQUE INDEX "ReturnRate_tier_enchantmentLevel_key" ON "ReturnRate"("tier", "enchantmentLevel");

-- CreateIndex
CREATE INDEX "ImportJob_status_idx" ON "ImportJob"("status");

-- CreateIndex
CREATE INDEX "ImportJob_type_idx" ON "ImportJob"("type");

-- CreateIndex
CREATE INDEX "ImportJob_createdAt_idx" ON "ImportJob"("createdAt");

-- CreateIndex
CREATE INDEX "ImportJob_triggeredById_idx" ON "ImportJob"("triggeredById");

-- CreateIndex
CREATE INDEX "ImportLog_jobId_idx" ON "ImportLog"("jobId");

-- CreateIndex
CREATE INDEX "ImportLog_level_idx" ON "ImportLog"("level");

-- CreateIndex
CREATE INDEX "ImportLog_createdAt_idx" ON "ImportLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_targetType_targetId_idx" ON "AuditLog"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_baseItemId_fkey" FOREIGN KEY ("baseItemId") REFERENCES "Item"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemLocalization" ADD CONSTRAINT "ItemLocalization_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CraftingRecipe" ADD CONSTRAINT "CraftingRecipe_resultItemId_fkey" FOREIGN KEY ("resultItemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CraftingRecipe" ADD CONSTRAINT "CraftingRecipe_craftingStationId_fkey" FOREIGN KEY ("craftingStationId") REFERENCES "CraftingStation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CraftingIngredient" ADD CONSTRAINT "CraftingIngredient_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "CraftingRecipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CraftingIngredient" ADD CONSTRAINT "CraftingIngredient_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefiningRecipe" ADD CONSTRAINT "RefiningRecipe_resultItemId_fkey" FOREIGN KEY ("resultItemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefiningRecipe" ADD CONSTRAINT "RefiningRecipe_craftingStationId_fkey" FOREIGN KEY ("craftingStationId") REFERENCES "CraftingStation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefiningIngredient" ADD CONSTRAINT "RefiningIngredient_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "RefiningRecipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefiningIngredient" ADD CONSTRAINT "RefiningIngredient_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CityItemBonus" ADD CONSTRAINT "CityItemBonus_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CityItemBonus" ADD CONSTRAINT "CityItemBonus_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportJob" ADD CONSTRAINT "ImportJob_triggeredById_fkey" FOREIGN KEY ("triggeredById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportLog" ADD CONSTRAINT "ImportLog_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "ImportJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
