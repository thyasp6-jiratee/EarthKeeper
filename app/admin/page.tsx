// app/admin/page.tsx
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import {
  Plus, Trash2, Edit2, Users, MapPin, Trash, Leaf,
  Shield, UserCog, Calendar, Mail, Phone
} from 'lucide-react';

// ===== METADATA =====
export const metadata = {
  title: 'Admin Panel - Earth Keeper',
  description: 'Kelola pengguna, jenis sampah, dan wilayah',
};

// ===== REVALIDATION =====
export const revalidate = 60;

// ===== TYPES =====
type StatusCounts = Record<string, number>;

// ===== MAIN COMPONENT =====
export default async function AdminPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  // ===== FETCH DATA =====
  const [users, jenisSampah, wilayah, stats] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true,
        nama: true,
        email: true,
        noHp: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            laporanSampah: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.jenisSampah.findMany({
      select: {
        id: true,
        namaJenis: true,
        deskripsi: true,
        _count: {
          select: {
            laporanSampah: true,
          },
        },
      },
      orderBy: { namaJenis: 'asc' },
    }),
    prisma.wilayah.findMany({
      select: {
        id: true,
        namaWilayah: true,
        deskripsi: true,
        _count: {
          select: {
            laporanSampah: true,
          },
        },
      },
      orderBy: { namaWilayah: 'asc' },
    }),
    prisma.$transaction([
      prisma.user.count(),
      prisma.jenisSampah.count(),
      prisma.wilayah.count(),
      prisma.laporanSampah.count(),
      prisma.laporanSampah.groupBy({
        by: ['status'],
        _count: {
          _all: true,
        },
        orderBy: {
          status: 'asc',
        },
      }),
    ]),
  ]);

  const [totalUsers, totalJenis, totalWilayah, totalLaporan, laporanByStatus] = stats;

  // ===== STATUS COUNTS (FIX TypeScript) =====
  const statusCounts: StatusCounts = {};
  laporanByStatus.forEach((item) => {
    // Cast ke any biar TypeScript gak rewel soal _count
    const count = (item._count as any)?._all ?? 0;
    statusCounts[item.status] = count;
  });

  // ===== STATISTICS CARDS =====
  const statCards = [
    {
      label: 'Total Pengguna',
      value: totalUsers,
      icon: Users,
      color: 'from-purple-500 to-purple-600',
      bg: 'bg-purple-50',
      border: 'border-purple-500',
    },
    {
      label: 'Total Laporan',
      value: totalLaporan,
      icon: Leaf,
      color: 'from-emerald-500 to-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-500',
    },
    {
      label: 'Jenis Sampah',
      value: totalJenis,
      icon: Trash,
      color: 'from-amber-500 to-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-500',
    },
    {
      label: 'Wilayah',
      value: totalWilayah,
      icon: MapPin,
      color: 'from-blue-500 to-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-500',
    },
  ];

  // ===== STATUS BADGES =====
  const statusBadges = [
    {
      status: 'MENUNGGU',
      label: 'Menunggu',
      wrapperClass: 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-500',
      labelClass: 'text-gray-700',
      valueClass: 'text-gray-800',
      badgeClass: 'bg-gray-500',
    },
    {
      status: 'DIPROSES',
      label: 'Diproses',
      wrapperClass: 'bg-gradient-to-r from-amber-50 to-amber-100 border-amber-500',
      labelClass: 'text-amber-700',
      valueClass: 'text-amber-800',
      badgeClass: 'bg-amber-500',
    },
    {
      status: 'SELESAI',
      label: 'Selesai',
      wrapperClass: 'bg-gradient-to-r from-green-50 to-green-100 border-green-500',
      labelClass: 'text-green-700',
      valueClass: 'text-green-800',
      badgeClass: 'bg-green-500',
    },
  ];

  // ===== ROLE BADGE COLOR =====
  const getRoleBadge = (role: string) => {
    const styles = {
      ADMIN: 'bg-purple-100 text-purple-700 border-purple-200',
      PETUGAS: 'bg-blue-100 text-blue-700 border-blue-200',
      MASYARAKAT: 'bg-green-100 text-green-700 border-green-200',
    };
    return styles[role as keyof typeof styles] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  // ===== FORMAT DATE =====
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-amber-50 p-4">
      <div className="container mx-auto">
        {/* HEADER */}
        <div className="bg-gradient-to-r from-purple-700 to-purple-900 rounded-2xl shadow-xl p-6 mb-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500 rounded-full opacity-10 -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-400 rounded-full opacity-10 -ml-24 -mb-24"></div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
            <div className="flex items-center gap-4">
              <div className="bg-amber-400 p-3 rounded-2xl">
                <Shield className="w-8 h-8 text-purple-900" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Admin Panel</h1>
                <p className="text-purple-200 mt-1">Kelola sistem Earth Keeper</p>
              </div>
            </div>
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-white text-purple-700 rounded-lg hover:bg-purple-50 transition font-semibold flex items-center gap-2 shadow-lg"
            >
              <UserCog className="w-4 h-4" />
              Kembali ke Dashboard
            </Link>
          </div>
        </div>

        {/* STATISTICS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className={`${stat.bg} rounded-2xl shadow-lg p-6 hover:shadow-xl transition border-l-4 ${stat.border}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">{stat.value}</p>
                  </div>
                  <div className={`bg-gradient-to-br ${stat.color} p-3 rounded-xl`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* STATUS QUICK VIEW */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {statusBadges.map((item) => (
            <div
              key={item.status}
              className={`rounded-xl p-4 border-l-4 ${item.wrapperClass}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className={`font-semibold ${item.labelClass}`}>{item.label}</p>
                  <p className={`text-2xl font-bold ${item.valueClass}`}>
                    {statusCounts[item.status] || 0}
                  </p>
                </div>
                <div className={`p-2 rounded-full ${item.badgeClass}`}>
                  <span className="text-white font-bold text-xs">
                    {statusCounts[item.status] || 0}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* USERS SECTION */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 hover:shadow-xl transition">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              Data Pengguna
              <span className="text-sm font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                {users.length} pengguna
              </span>
            </h2>
            <div className="flex gap-2 w-full sm:w-auto">
              <Link
                href="/admin/users/create"
                className="flex-1 sm:flex-initial px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Tambah Pengguna
              </Link>
            </div>
          </div>

          {users.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Belum ada pengguna terdaftar</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-3 text-sm font-semibold text-gray-600">Nama</th>
                    <th className="text-left py-3 text-sm font-semibold text-gray-600">Email</th>
                    <th className="text-left py-3 text-sm font-semibold text-gray-600">No HP</th>
                    <th className="text-left py-3 text-sm font-semibold text-gray-600">Role</th>
                    <th className="text-left py-3 text-sm font-semibold text-gray-600">Laporan</th>
                    <th className="text-left py-3 text-sm font-semibold text-gray-600">Bergabung</th>
                    <th className="text-center py-3 text-sm font-semibold text-gray-600">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b hover:bg-purple-50 transition">
                      <td className="py-3 text-sm font-medium text-gray-800">{u.nama}</td>
                      <td className="py-3 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {u.email}
                        </span>
                      </td>
                      <td className="py-3 text-sm text-gray-600">
                        {u.noHp ? (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {u.noHp}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-3 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRoleBadge(u.role)}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 text-sm">
                        <span className="bg-gray-100 px-2 py-1 rounded-full text-xs">
                          {u._count.laporanSampah} laporan
                        </span>
                      </td>
                      <td className="py-3 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(u.createdAt)}
                        </span>
                      </td>
                      <td className="py-3 text-sm">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded transition"
                            aria-label={`Edit ${u.nama}`}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition"
                            aria-label={`Hapus ${u.nama}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* JENIS SAMPAH SECTION */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 hover:shadow-xl transition">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Trash className="w-5 h-5 text-amber-600" />
              Jenis Sampah
              <span className="text-sm font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                {jenisSampah.length} jenis
              </span>
            </h2>
            <button className="flex-1 sm:flex-initial px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" />
              Tambah Jenis Sampah
            </button>
          </div>

          {jenisSampah.length === 0 ? (
            <div className="text-center py-8">
              <Trash className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Belum ada jenis sampah</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              {jenisSampah.map((item) => (
                <div
                  key={item.id}
                  className="group px-4 py-2 bg-amber-50 border border-amber-200 rounded-full text-sm flex items-center gap-3 hover:shadow-md transition"
                >
                  <span className="text-amber-800 font-medium">{item.namaJenis}</span>
                  {item.deskripsi && (
                    <span className="text-xs text-amber-600">({item.deskripsi})</span>
                  )}
                  <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded-full">
                    {item._count.laporanSampah} laporan
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      className="p-1 text-blue-600 hover:bg-amber-200 rounded transition opacity-0 group-hover:opacity-100"
                      aria-label={`Edit ${item.namaJenis}`}
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      className="p-1 text-red-600 hover:bg-amber-200 rounded transition opacity-0 group-hover:opacity-100"
                      aria-label={`Hapus ${item.namaJenis}`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* WILAYAH SECTION */}
        <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              Wilayah
              <span className="text-sm font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                {wilayah.length} wilayah
              </span>
            </h2>
            <button className="flex-1 sm:flex-initial px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" />
              Tambah Wilayah
            </button>
          </div>

          {wilayah.length === 0 ? (
            <div className="text-center py-8">
              <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Belum ada wilayah terdaftar</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              {wilayah.map((item) => (
                <div
                  key={item.id}
                  className="group px-4 py-2 bg-blue-50 border border-blue-200 rounded-full text-sm flex items-center gap-3 hover:shadow-md transition"
                >
                  <span className="text-blue-800 font-medium">{item.namaWilayah}</span>
                  {item.deskripsi && (
                    <span className="text-xs text-blue-600">({item.deskripsi})</span>
                  )}
                  <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded-full">
                    {item._count.laporanSampah} laporan
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      className="p-1 text-blue-600 hover:bg-blue-200 rounded transition opacity-0 group-hover:opacity-100"
                      aria-label={`Edit ${item.namaWilayah}`}
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      className="p-1 text-red-600 hover:bg-blue-200 rounded transition opacity-0 group-hover:opacity-100"
                      aria-label={`Hapus ${item.namaWilayah}`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}