// app/api/jenis-sampah/route.ts

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  try {
    const jenisSampah = await prisma.jenisSampah.findMany({
      orderBy: { namaJenis: 'asc' },
    })
    return NextResponse.json(jenisSampah)
  } catch (error) {
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { namaJenis } = body

    if (!namaJenis) {
      return NextResponse.json(
        { error: 'Nama jenis sampah wajib diisi' },
        { status: 400 }
      )
    }

    const jenis = await prisma.jenisSampah.create({
      data: { namaJenis },
    })

    return NextResponse.json(jenis)
  } catch (error) {
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}