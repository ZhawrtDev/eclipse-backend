/*
  Warnings:

  - You are about to drop the column `players` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "players";

-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "thumbnail" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "owner" TEXT NOT NULL,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);
