// app/api/laporan/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// ===== KONFIGURASI REWARD =====
const REWARD_PER_KG = 2000 // Rp 2.000 per kg sampah

// ===== PATCH: Update status + Kasih reward =====
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.role !== 'ADMIN' && user.role !== 'PETUGAS') {
      return NextResponse.json(
        { error: 'Hanya petugas yang bisa update status' },
        { status: 403 }
      )
    }

    const { id } = await context.params

    if (!id) {
      return NextResponse.json(
        { error: 'ID laporan tidak ditemukan' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { status } = body

    const validStatus = ['MENUNGGU', 'DIPROSES', 'SELESAI']
    if (!validStatus.includes(status)) {
      return NextResponse.json(
        { error: 'Status tidak valid' },
        { status: 400 }
      )
    }

    // ===== TRANSAKSI DATABASE =====
    const result = await prisma.$transaction(async (tx) => {
      // 1. Ambil data laporan
      const laporan = await tx.laporanSampah.findUnique({
        where: { id },
        include: {
          user: { select: { nama: true } },
          transaksi: true,
        },
      })

      if (!laporan) throw new Error('Laporan tidak ditemukan')
      
      if (laporan.status === 'SELESAI' && status === 'MENUNGGU') {
        throw new Error('Status tidak bisa dikembalikan ke MENUNGGU')
      }

      // 2. Update status laporan
      const updated = await tx.laporanSampah.update({
        where: { id },
        data: { status },
        include: {
          user: { select: { nama: true, email: true, noHp: true } },
          jenisSampah: { select: { namaJenis: true } },
          wilayah: { select: { namaWilayah: true } },
          fotoSampah: { select: { imageUrl: true } },
        },
      })

      // 3. KASIH REWARD kalau status jadi SELESAI
      // Cek: dulu bukan SELESAI, sekarang SELESAI, belum pernah dapat reward
      if (
        status === 'SELESAI' &&
        laporan.status !== 'SELESAI' &&
        !laporan.transaksi
      ) {
        const reward = Math.round(updated.berat * REWARD_PER_KG)

        // 3a. Tambah saldo user
        await tx.user.update({
          where: { id: updated.userId },
          data: {
            saldo: { increment: reward },
          },
        })

        // 3b. Catat transaksi
        await tx.transaksi.create({
          data: {
            userId: updated.userId,
            laporanId: updated.id,
            tipe: 'MASUK',
            jumlah: reward,
            keterangan: `Reward laporan ${updated.berat} kg ${updated.jenisSampah.namaJenis} - ${updated.wilayah.namaWilayah}`,
            status: 'BERHASIL',
          },
        })

        console.log(`💰 User ${updated.user.nama} dapat Rp ${reward.toLocaleString('id-ID')}`)
      }

      return updated
    })

    return NextResponse.json({
      success: true,
      data: result,
      message: `Status berhasil diubah ke ${status}`,
    })
  } catch (error: any) {
    console.error('Error updating status:', error)
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

// ===== DELETE: Hapus laporan =====
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.role !== 'ADMIN' && user.role !== 'PETUGAS') {
      return NextResponse.json(
        { error: 'Hanya petugas yang bisa hapus laporan' },
        { status: 403 }
      )
    }

    const { id } = await context.params

    if (!id) {
      return NextResponse.json(
        { error: 'ID laporan tidak ditemukan' },
        { status: 400 }
      )
    }

    await prisma.$transaction(async (tx) => {
      const laporan = await tx.laporanSampah.findUnique({
        where: { id },
        include: { transaksi: true },
      })

      if (!laporan) throw new Error('Laporan tidak ditemukan')

      // Kalau laporan udah selesai & ada transaksi, tarik balik saldonya
      if (laporan.status === 'SELESAI' && laporan.transaksi) {
        await tx.user.update({
          where: { id: laporan.userId },
          data: {
            saldo: { decrement: laporan.transaksi.jumlah },
          },
        })

        await tx.transaksi.update({
          where: { id: laporan.transaksi.id },
          data: {
            status: 'GAGAL',
            keterangan: `${laporan.transaksi.keterangan} [DIBATALKAN - laporan dihapus]`,
          },
        })
      }

      await tx.fotoSampah.deleteMany({
        where: { laporanId: id },
      })

      await tx.laporanSampah.delete({
        where: { id },
      })
    })

    return NextResponse.json({
      success: true,
      message: 'Laporan berhasil dihapus',
    })
  } catch (error: any) {
    console.error('Error deleting laporan:', error)
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

// ===== GET: Detail laporan =====
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params

    if (!id) {
      return NextResponse.json(
        { error: 'ID laporan tidak ditemukan' },
        { status: 400 }
      )
    }

    const laporan = await prisma.laporanSampah.findUnique({
      where: { id },
      include: {
        user: { select: { nama: true, email: true, noHp: true } },
        jenisSampah: true,
        wilayah: true,
        fotoSampah: true,
        transaksi: true,
      },
    })

    if (!laporan) {
      return NextResponse.json(
        { error: 'Laporan tidak ditemukan' },
        { status: 404 }
      )
    }

    return NextResponse.json(laporan)
  } catch (error) {
    console.error('Error fetching laporan detail:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}