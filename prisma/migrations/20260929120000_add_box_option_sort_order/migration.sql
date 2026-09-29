-- AlterTable
ALTER TABLE "PoolBoxPlayerOption" ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- Backfill existing options in their original (creation) order
UPDATE "PoolBoxPlayerOption" AS o
SET "sortOrder" = ranked.rn
FROM (
  SELECT "id", ROW_NUMBER() OVER (PARTITION BY "poolBoxId" ORDER BY "createdAt" ASC) - 1 AS rn
  FROM "PoolBoxPlayerOption"
) AS ranked
WHERE o."id" = ranked."id";
