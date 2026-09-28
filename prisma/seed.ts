// prisma/seed.ts

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Hash password
  const salt = await bcrypt.genSalt(10)
  const hashedPassword = await bcrypt.hash('password123', salt)

  // Seed Jenis Sampah
  const jenisSampahData = [
    { namaJenis: 'Organik' },
    { namaJenis: 'Anorganik' },
    { namaJenis: 'B3 (Bahan Berbahaya)' },
    { namaJenis: 'Plastik' },
    { namaJenis: 'Kertas' },
    { namaJenis: 'Logam' },
    { namaJenis: 'Kaca' },
    { namaJenis: 'Elektronik' },
  ]

  for (const data of jenisSampahData) {
    await prisma.jenisSampah.upsert({
      where: { namaJenis: data.namaJenis },
      update: {},
      create: data,
    })
  }
  console.log('✅ Jenis Sampah seeded')

  // Seed Wilayah
  const wilayahData = [
    { namaWilayah: 'Jakarta Pusat' },
    { namaWilayah: 'Jakarta Barat' },
    { namaWilayah: 'Jakarta Selatan' },
    { namaWilayah: 'Jakarta Timur' },
    { namaWilayah: 'Jakarta Utara' },
    { namaWilayah: 'Bogor' },
    { namaWilayah: 'Depok' },
    { namaWilayah: 'Tangerang' },
    { namaWilayah: 'Bekasi' },
  ]

  for (const data of wilayahData) {
    await prisma.wilayah.upsert({
      where: { namaWilayah: data.namaWilayah },
      update: {},
      create: data,
    })
  }
  console.log('✅ Wilayah seeded')

  // Seed Users dengan 3 role
  const users = [
    {
      nama: 'Admin Earth Keeper',
      email: 'admin@earthkeeper.com',
      noHp: '081234567890',
      password: hashedPassword,
      role: 'ADMIN' as const,
    },
    {
      nama: 'Petugas Lapangan',
      email: 'petugas@earthkeeper.com',
      noHp: '082345678901',
      password: hashedPassword,
      role: 'PETUGAS' as const,
    },
    {
      nama: 'Masyarakat Sampah',
      email: 'masyarakat@earthkeeper.com',
      noHp: '083456789012',
      password: hashedPassword,
      role: 'MASYARAKAT' as const,
    },
  ]

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: user,
    })
  }
  console.log('✅ Users seeded (3 roles)')

  console.log('🎉 Seeding selesai!')
  console.log('📝 Login credentials:')
  console.log('  - Admin: admin@earthkeeper.com / password123')
  console.log('  - Petugas: petugas@earthkeeper.com / password123')
  console.log('  - Masyarakat: masyarakat@earthkeeper.com / password123')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })