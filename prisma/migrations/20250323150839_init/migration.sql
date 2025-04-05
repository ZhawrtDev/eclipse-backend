-- CreateTable
CREATE TABLE "Game" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "creatorName" TEXT NOT NULL,
    "playing" INTEGER,
    "visits" INTEGER,
    "maxPlayers" INTEGER,
    "updated" TIMESTAMP(3) NOT NULL,
    "created" TIMESTAMP(3) NOT NULL,
    "favoritedCount" INTEGER,
    "universeAvatarType" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "description" TEXT,
    "jobId" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Game_id_key" ON "Game"("id");
