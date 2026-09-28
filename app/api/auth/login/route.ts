import { NextRequest, NextResponse } from 'next/server'
import { login } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email dan password wajib diisi' },
        { status: 400 }
      )
    }

    const result = await login(email, password)

    // Cek jika ada error atau user tidak ditemukan
    if (result.error || !result.user) {
      return NextResponse.json(
        { error: result.error || 'Login gagal' },
        { status: 401 }
      )
    }

    // Menggunakan await untuk cookies()
    const cookieStore = await cookies()
    cookieStore.set('token', result.token!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 hari
    })

    // Sekarang TypeScript tahu 100% bahwa result.user itu ADA
    return NextResponse.json({
      success: true,
      user: {
        id: result.user.id,
        nama: result.user.nama,
        email: result.user.email,
        role: result.user.role,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}