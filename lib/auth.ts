import { prisma } from './prisma'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

const JWT_SECRET = process.env.JWT_SECRET || 'rahasia123'

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
  })

  if (!user) {
    return { error: 'Email atau password salah' }
  }

  const isValid = await bcrypt.compare(password, user.password)
  if (!isValid) {
    return { error: 'Email atau password salah' }
  }

  // Buat token
  const token = jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      role: user.role,
      nama: user.nama 
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  )

  return { token, user }
}

export async function getCurrentUser() {
  // Menggunakan await untuk cookies() Next.js terbaru
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value

  if (!token) {
    return null
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        nama: true,
        email: true,
        noHp: true,
        role: true,
        createdAt: true,
      },
    })
    return user
  } catch (error) {
    return null
  }
}

export function isAdmin(user: any) {
  return user?.role === 'ADMIN'
}

export function isPetugas(user: any) {
  return user?.role === 'PETUGAS' || user?.role === 'ADMIN'
}

export function isMasyarakat(user: any) {
  return user?.role === 'MASYARAKAT'
}