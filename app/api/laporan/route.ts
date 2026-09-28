// app/api/laporan/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'

// ===== GET: Ambil semua laporan =====
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Silakan login ulang' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const userId = searchParams.get('userId')

    const where: any = {}
    if (status) where.status = status
    if (userId) where.userId = userId

    // Kalau MASYARAKAT, cuma lihat laporan sendiri
    if (user.role === 'MASYARAKAT') {
      where.userId = user.id
    }

    const laporan = await prisma.laporanSampah.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            nama: true,
            email: true,
            noHp: true,
          },
        },
        jenisSampah: {
          select: { namaJenis: true },
        },
        wilayah: {
          select: { namaWilayah: true },
        },
        fotoSampah: {
          select: { imageUrl: true },
        },
      },
    })

    return NextResponse.json(laporan)
  } catch (error: any) {
    console.error('Error fetching laporan:', error)
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

// ===== POST: Buat laporan baru =====
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Silakan login ulang' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const berat = formData.get('berat') as string
    const jenisSampahId = formData.get('jenisSampahId') as string
    const wilayahId = formData.get('wilayahId') as string
    const foto = formData.get('foto') as File

    // Validasi
    const beratNum = parseFloat(berat)
    if (isNaN(beratNum) || beratNum <= 0) {
      return NextResponse.json(
        { error: 'Berat sampah harus lebih dari 0 kg' },
        { status: 400 }
      )
    }

    if (!foto) {
      return NextResponse.json(
        { error: 'Foto sampah wajib diupload' },
        { status: 400 }
      )
    }

    // Simpan foto
    const uploadsDir = join(process.cwd(), 'public/uploads')
    try {
      await mkdir(uploadsDir, { recursive: true })
    } catch {
      // Folder sudah ada
    }

    const bytes = await foto.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const filename = `${randomUUID()}-${foto.name.replace(/\s/g, '-')}`
    const filePath = join(uploadsDir, filename)

    await writeFile(filePath, buffer)
    const imageUrl = `/uploads/${filename}`

    // Transaksi
    const laporan = await prisma.$transaction(async (tx) => {
      const newLaporan = await tx.laporanSampah.create({
        data: {
          berat: beratNum,
          userId: user.id,
          jenisSampahId,
          wilayahId,
          status: 'MENUNGGU',
        },
      })

      const newFoto = await tx.fotoSampah.create({
        data: {
          imageUrl,
          laporanId: newLaporan.id,
        },
      })

      return {
        ...newLaporan,
        fotoSampah: newFoto,
      }
    })

    return NextResponse.json({
      success: true,
      data: laporan,
      message: 'Laporan berhasil dibuat!',
    })
  } catch (error: any) {
    console.error('Error creating laporan:', error)
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}