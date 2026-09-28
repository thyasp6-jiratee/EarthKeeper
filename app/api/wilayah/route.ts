// app/api/wilayah/route.ts

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  try {
    const wilayah = await prisma.wilayah.findMany({
      orderBy: { namaWilayah: 'asc' },
    })
    return NextResponse.json(wilayah)
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
    const { namaWilayah } = body

    if (!namaWilayah) {
      return NextResponse.json(
        { error: 'Nama wilayah wajib diisi' },
        { status: 400 }
      )
    }

    const wilayah = await prisma.wilayah.create({
      data: { namaWilayah },
    })

    return NextResponse.json(wilayah)
  } catch (error) {
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}