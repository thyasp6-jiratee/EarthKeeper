// app/api/auth/register/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nama, email, noHp, password } = body

    // Validasi
    if (!nama || !email || !noHp || !password) {
      return NextResponse.json(
        { error: 'Semua field wajib diisi' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password minimal 6 karakter' },
        { status: 400 }
      )
    }

    // Cek email sudah terdaftar
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { noHp },
        ],
      },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email atau Nomor HP sudah terdaftar' },
        { status: 400 }
      )
    }

    // Hash password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    // Create user
    const user = await prisma.user.create({
      data: {
        nama,
        email,
        noHp,
        password: hashedPassword,
        role: 'MASYARAKAT', // Default role
      },
      select: {
        id: true,
        nama: true,
        email: true,
        noHp: true,
        role: true,
      },
    })

    return NextResponse.json({
      success: true,
      user,
      message: 'Registrasi berhasil! Silakan login.',
    })
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}