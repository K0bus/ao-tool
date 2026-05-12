-- CreateEnum
CREATE TYPE "BuildContentType" AS ENUM (
  'OPEN_WORLD',
  'MISTS_SOLO',
  'MISTS_DUO',
  'CORRUPTED_DUNGEON',
  'HELLGATE_2V2',
  'HELLGATE_5V5',
  'SMALL_SCALE',
  'ZVZ',
  'CRYSTAL_ARENA_1V1',
  'CRYSTAL_ARENA_5V5',
  'TRACKING_SOLO',
  'TRACKING_GROUP',
  'FAME_FARM_SOLO',
  'FAME_FARM_GROUP',
  'FAME_FARM_GROUP_AVALON',
  'GANK_SOLO',
  'GANK_GROUP',
  'ABYSSAL_DEPTHS_2V2',
  'ABYSSAL_DEPTHS_3V3',
  'GATHERING',
  'HCE',
  'ROADS'
);

-- CreateEnum
CREATE TYPE "BuildRole" AS ENUM (
  'DPS',
  'BURST_DPS',
  'HEALER',
  'TANK',
  'SUPPORT',
  'DISRUPTOR',
  'MOBILITY',
  'ECONOMY'
);

-- CreateEnum
CREATE TYPE "BuildGroupScale" AS ENUM (
  'SOLO',
  'DUO',
  'SMALL_GROUP',
  'PARTY',
  'RAID',
  'MASSIVE'
);

-- CreateEnum
CREATE TYPE "BuildPlaystyle" AS ENUM (
  'SAFE_PVE',
  'PVE_PVP',
  'ONE_SHOT',
  'KITE',
  'BRAWL',
  'DIVE',
  'SUSTAIN',
  'ESCAPE',
  'CATCH'
);

-- CreateEnum
CREATE TYPE "BuildDifficulty" AS ENUM (
  'BEGINNER',
  'INTERMEDIATE',
  'ADVANCED'
);

-- CreateEnum
CREATE TYPE "BuildBudget" AS ENUM (
  'LOW',
  'MEDIUM',
  'HIGH',
  'LUXURY'
);

-- AlterTable
ALTER TABLE "Build"
ADD COLUMN "primaryContentType" "BuildContentType",
ADD COLUMN "contentTypes" "BuildContentType"[] NOT NULL DEFAULT ARRAY[]::"BuildContentType"[],
ADD COLUMN "roles" "BuildRole"[] NOT NULL DEFAULT ARRAY[]::"BuildRole"[],
ADD COLUMN "groupScales" "BuildGroupScale"[] NOT NULL DEFAULT ARRAY[]::"BuildGroupScale"[],
ADD COLUMN "playstyles" "BuildPlaystyle"[] NOT NULL DEFAULT ARRAY[]::"BuildPlaystyle"[],
ADD COLUMN "difficulty" "BuildDifficulty",
ADD COLUMN "budget" "BuildBudget",
ADD COLUMN "weaponCategory" TEXT,
ADD COLUMN "weaponSubcategory" TEXT;

-- CreateIndex
CREATE INDEX "Build_visibility_primaryContentType_idx" ON "Build"("visibility", "primaryContentType");

-- CreateIndex
CREATE INDEX "Build_weaponSubcategory_idx" ON "Build"("weaponSubcategory");
