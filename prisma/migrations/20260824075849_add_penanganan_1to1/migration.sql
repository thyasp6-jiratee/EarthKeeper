-- CreateTable
CREATE TABLE "penanganan" (
    "id" TEXT NOT NULL,
    "catatanPetugas" TEXT NOT NULL,
    "tanggalSelesai" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "laporanId" TEXT NOT NULL,

    CONSTRAINT "penanganan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "penanganan_laporanId_key" ON "penanganan"("laporanId");

-- AddForeignKey
ALTER TABLE "penanganan" ADD CONSTRAINT "penanganan_laporanId_fkey" FOREIGN KEY ("laporanId") REFERENCES "laporan_sampah"("id") ON DELETE CASCADE ON UPDATE CASCADE;
