-- DropIndex
DROP INDEX "foto_sampah_laporanId_key";

-- CreateIndex
CREATE INDEX "foto_sampah_laporanId_idx" ON "foto_sampah"("laporanId");
