/*
  Warnings:

  - Added the required column `password` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'PETUGAS', 'MASYARAKAT');

-- AlterTable
ALTER TABLE "laporan_sampah" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'MENUNGGU';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "password" TEXT NOT NULL,
ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'MASYARAKAT';

-- CreateIndex
CREATE INDEX "laporan_sampah_status_idx" ON "laporan_sampah"("status");
