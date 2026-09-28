// app/api/transaksi/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// ===== GET: Riwayat transaksi user =====
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    const where: any = {}

    // Masyarakat: cuma lihat transaksi sendiri
    if (user.role === 'MASYARAKAT') {
      where.userId = user.id
    } else if (userId) {
      // Admin/petugas bisa filter by userId
      where.userId = userId
    }

    const transaksi = await prisma.transaksi.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { nama: true, email: true } },
        laporan: {
          select: {
            berat: true,
            jenisSampah: { select: { namaJenis: true } },
            wilayah: { select: { namaWilayah: true } },
          },
        },
      },
    })

    return NextResponse.json(transaksi)
  } catch (error) {
    console.error('Error fetching transaksi:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}