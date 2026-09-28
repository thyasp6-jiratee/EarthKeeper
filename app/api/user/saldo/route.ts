// app/api/user/saldo/route.ts

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        nama: true,
        saldo: true,
      },
    })

    // Total reward yang pernah didapat
    const totalReward = await prisma.transaksi.aggregate({
      where: {
        userId: user.id,
        tipe: 'MASUK',
        status: 'BERHASIL',
      },
      _sum: {
        jumlah: true,
      },
    })

    return NextResponse.json({
      saldo: userData?.saldo || 0,
      totalReward: totalReward._sum.jumlah || 0,
      nama: userData?.nama,
    })
  } catch (error) {
    console.error('Error fetching saldo:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}