-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'ENTRANT');

-- CreateEnum
CREATE TYPE "SeasonStatus" AS ENUM ('DRAFT', 'OPEN', 'LOCKED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "teamName" VARCHAR(80),
    "teamLogoData" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'ENTRANT',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Season" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "SeasonStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Season_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pool" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "entrantLimit" INTEGER,
    "boxCount" INTEGER NOT NULL,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "lockAt" TIMESTAMP(3),
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PoolEntrant" (
    "id" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PoolEntrant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PoolBox" (
    "id" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,
    "boxOrder" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PoolBox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PoolBoxPlayerOption" (
    "id" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,
    "poolBoxId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PoolBoxPlayerOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "nhlId" INTEGER NOT NULL,
    "abbreviation" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logoUrl" TEXT,
    "primaryColorHex" TEXT,
    "secondaryColorHex" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL,
    "nhlId" INTEGER NOT NULL,
    "teamId" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "headshotUrl" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntrantPick" (
    "id" TEXT NOT NULL,
    "poolEntrantId" TEXT NOT NULL,
    "poolBoxId" TEXT NOT NULL,
    "playerOptionId" TEXT NOT NULL,
    "pickedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,

    CONSTRAINT "EntrantPick_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyPlayerStat" (
    "id" TEXT NOT NULL,
    "gameId" INTEGER NOT NULL,
    "statDate" TIMESTAMP(3) NOT NULL,
    "playerId" TEXT NOT NULL,
    "goals" INTEGER NOT NULL DEFAULT 0,
    "assists" INTEGER NOT NULL DEFAULT 0,
    "goalieWin" INTEGER NOT NULL DEFAULT 0,
    "goalieShutout" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyPlayerStat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScoreLedger" (
    "id" TEXT NOT NULL,
    "poolEntrantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "statDate" TIMESTAMP(3) NOT NULL,
    "points" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScoreLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NhlSyncLog" (
    "id" TEXT NOT NULL,
    "poolId" TEXT,
    "syncType" TEXT NOT NULL,
    "status" "SyncStatus" NOT NULL DEFAULT 'PENDING',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "recordsUpserted" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,

    CONSTRAINT "NhlSyncLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Pool_seasonId_key" ON "Pool"("seasonId");

-- CreateIndex
CREATE UNIQUE INDEX "PoolEntrant_poolId_userId_key" ON "PoolEntrant"("poolId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "PoolBox_poolId_boxOrder_key" ON "PoolBox"("poolId", "boxOrder");

-- CreateIndex
CREATE UNIQUE INDEX "PoolBoxPlayerOption_poolId_playerId_key" ON "PoolBoxPlayerOption"("poolId", "playerId");

-- CreateIndex
CREATE UNIQUE INDEX "PoolBoxPlayerOption_poolBoxId_playerId_key" ON "PoolBoxPlayerOption"("poolBoxId", "playerId");

-- CreateIndex
CREATE UNIQUE INDEX "Team_nhlId_key" ON "Team"("nhlId");

-- CreateIndex
CREATE UNIQUE INDEX "Team_abbreviation_key" ON "Team"("abbreviation");

-- CreateIndex
CREATE UNIQUE INDEX "Player_nhlId_key" ON "Player"("nhlId");

-- CreateIndex
CREATE UNIQUE INDEX "EntrantPick_poolEntrantId_poolBoxId_key" ON "EntrantPick"("poolEntrantId", "poolBoxId");

-- CreateIndex
CREATE UNIQUE INDEX "DailyPlayerStat_gameId_playerId_key" ON "DailyPlayerStat"("gameId", "playerId");

-- CreateIndex
CREATE UNIQUE INDEX "ScoreLedger_poolEntrantId_statDate_key" ON "ScoreLedger"("poolEntrantId", "statDate");

-- AddForeignKey
ALTER TABLE "Pool" ADD CONSTRAINT "Pool_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pool" ADD CONSTRAINT "Pool_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoolEntrant" ADD CONSTRAINT "PoolEntrant_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "Pool"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoolEntrant" ADD CONSTRAINT "PoolEntrant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoolBox" ADD CONSTRAINT "PoolBox_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "Pool"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoolBoxPlayerOption" ADD CONSTRAINT "PoolBoxPlayerOption_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "Pool"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoolBoxPlayerOption" ADD CONSTRAINT "PoolBoxPlayerOption_poolBoxId_fkey" FOREIGN KEY ("poolBoxId") REFERENCES "PoolBox"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoolBoxPlayerOption" ADD CONSTRAINT "PoolBoxPlayerOption_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntrantPick" ADD CONSTRAINT "EntrantPick_poolEntrantId_fkey" FOREIGN KEY ("poolEntrantId") REFERENCES "PoolEntrant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntrantPick" ADD CONSTRAINT "EntrantPick_poolBoxId_fkey" FOREIGN KEY ("poolBoxId") REFERENCES "PoolBox"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntrantPick" ADD CONSTRAINT "EntrantPick_playerOptionId_fkey" FOREIGN KEY ("playerOptionId") REFERENCES "PoolBoxPlayerOption"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntrantPick" ADD CONSTRAINT "EntrantPick_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyPlayerStat" ADD CONSTRAINT "DailyPlayerStat_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoreLedger" ADD CONSTRAINT "ScoreLedger_poolEntrantId_fkey" FOREIGN KEY ("poolEntrantId") REFERENCES "PoolEntrant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoreLedger" ADD CONSTRAINT "ScoreLedger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NhlSyncLog" ADD CONSTRAINT "NhlSyncLog_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "Pool"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
