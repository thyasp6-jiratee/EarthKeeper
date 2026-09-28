-- CreateTable
CREATE TABLE "transaksi" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "laporanId" TEXT,
    "tipe" TEXT NOT NULL,
    "jumlah" INTEGER NOT NULL,
    "keterangan" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'BERHASIL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transaksi_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "transaksi_laporanId_key" ON "transaksi"("laporanId");

-- CreateIndex
CREATE INDEX "transaksi_userId_idx" ON "transaksi"("userId");

-- CreateIndex
CREATE INDEX "transaksi_createdAt_idx" ON "transaksi"("createdAt");

-- AddForeignKey
ALTER TABLE "transaksi" ADD CONSTRAINT "transaksi_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaksi" ADD CONSTRAINT "transaksi_laporanId_fkey" FOREIGN KEY ("laporanId") REFERENCES "laporan_sampah"("id") ON DELETE SET NULL ON UPDATE CASCADE;
