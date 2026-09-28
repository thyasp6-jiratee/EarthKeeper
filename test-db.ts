// test-db.ts
import { prisma } from './lib/prisma'

async function testDatabase() {
  try {
    console.log('🔍 Testing database connection...\n')

    // Test 1: Count all data
    const userCount = await prisma.user.count()
    const jenisCount = await prisma.jenisSampah.count()
    const wilayahCount = await prisma.wilayah.count()

    console.log(`📊 Total Users: ${userCount}`)
    console.log(`📊 Total Jenis Sampah: ${jenisCount}`)
    console.log(`📊 Total Wilayah: ${wilayahCount}`)

    // Test 2: Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        nama: true,
        email: true,
        noHp: true,
      }
    })

    console.log('\n👥 Users:', users)

    // Test 3: Get all jenis sampah
    const jenisSampah = await prisma.jenisSampah.findMany()
    console.log('\n🗑️ Jenis Sampah:', jenisSampah)

    // Test 4: Get all wilayah
    const wilayah = await prisma.wilayah.findMany()
    console.log('\n📍 Wilayah:', wilayah)

    console.log('\n✅ Database test successful!')
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testDatabase()