// app/dashboard/page.tsx
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import Image from 'next/image';
import LogoutButton from '@/components/LogoutButton';

// ===== ICONS =====
import {
  Crown, Settings, Shield,
  ClipboardList, Clock,
  Leaf, Plus, User,
  FileText, MapPin, Trash2, Users, CheckCircle,
  Wallet, TrendingUp
} from 'lucide-react';

// ===== TYPES =====
type LaporanWithRelations = {
  id: string;
  berat: number;
  status: string;
  createdAt: Date;
  user?: { nama: string };
  jenisSampah: { namaJenis: string };
  wilayah: { namaWilayah: string };
  fotoSampah?: { imageUrl: string }[];
};

type StatusCounts = Record<string, number>;

// ===== METADATA =====
export const metadata = {
  title: 'Dashboard - Earth Keeper',
  description: 'Kelola laporan sampah Anda',
};

// ===== REVALIDATION =====
export const revalidate = 0;

// ===== FETCH ADMIN/PETUGAS =====
async function fetchAdminOrPetugasData() {
  try {
    const [
      totalLaporan,
      totalUser,
      totalWilayah,
      totalJenis,
      laporanByStatus,
      allReports,
    ] = await Promise.all([
      prisma.laporanSampah.count(),
      prisma.user.count(),
      prisma.wilayah.count(),
      prisma.jenisSampah.count(),
      prisma.laporanSampah.groupBy({
        by: ['status'],
        _count: true,
      }),
      prisma.laporanSampah.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          berat: true,
          status: true,
          createdAt: true,
          user: { select: { nama: true } },
          jenisSampah: { select: { namaJenis: true } },
          wilayah: { select: { namaWilayah: true } },
        },
      }),
    ]);

    return { totalLaporan, totalUser, totalWilayah, totalJenis, laporanByStatus, allReports };
  } catch (error) {
    console.error('Error fetching admin/petugas data:', error);
    return {
      totalLaporan: 0,
      totalUser: 0,
      totalWilayah: 0,
      totalJenis: 0,
      laporanByStatus: [],
      allReports: [],
    };
  }
}

// ===== FETCH USER (MASYARAKAT) =====
async function fetchUserDashboardData(userId: string) {
  try {
    const [
      userLaporan,
      total,
      selesai,
      menunggu,
      diproses,
      userData,
      totalReward,
    ] = await Promise.all([
      prisma.laporanSampah.findMany({
        where: { userId },
        take: 6,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          berat: true,
          status: true,
          createdAt: true,
          jenisSampah: { select: { namaJenis: true } },
          wilayah: { select: { namaWilayah: true } },
          fotoSampah: { select: { imageUrl: true } },
        },
      }),
      prisma.laporanSampah.count({ where: { userId } }),
      prisma.laporanSampah.count({ where: { userId, status: 'SELESAI' } }),
      prisma.laporanSampah.count({ where: { userId, status: 'MENUNGGU' } }),
      prisma.laporanSampah.count({ where: { userId, status: 'DIPROSES' } }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { saldo: true },
      }),
      prisma.transaksi.aggregate({
        where: { userId, tipe: 'MASUK', status: 'BERHASIL' },
        _sum: { jumlah: true },
      }),
    ]);

    return {
      userLaporan,
      stats: {
        total,
        selesai,
        menunggu,
        diproses,
        saldo: userData?.saldo || 0,
        totalReward: totalReward._sum.jumlah || 0,
      },
    };
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return {
      userLaporan: [],
      stats: { total: 0, selesai: 0, menunggu: 0, diproses: 0, saldo: 0, totalReward: 0 },
    };
  }
}

// ===== MAIN COMPONENT =====
export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  // ============================================================
  // ===== ADMIN DASHBOARD =====
  // ============================================================
  if (user.role === 'ADMIN') {
    const data = await fetchAdminOrPetugasData();
    const statusCounts: StatusCounts = data.laporanByStatus.reduce((acc, curr) => {
      acc[curr.status] = curr._count;
      return acc;
    }, {} as StatusCounts);

    const adminStats = [
      { label: 'Total Laporan', value: data.totalLaporan, icon: FileText, color: 'from-purple-500 to-purple-600' },
      { label: 'Total Pengguna', value: data.totalUser, icon: Users, color: 'from-amber-500 to-amber-600' },
      { label: 'Total Wilayah', value: data.totalWilayah, icon: MapPin, color: 'from-emerald-500 to-emerald-600' },
      { label: 'Jenis Sampah', value: data.totalJenis, icon: Trash2, color: 'from-rose-500 to-rose-600' },
    ];

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-amber-50">
        <div className="container mx-auto px-4 py-8">
          {/* ADMIN HEADER */}
          <div className="bg-gradient-to-r from-purple-700 to-purple-900 rounded-2xl shadow-xl p-6 mb-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500 rounded-full opacity-10 -mr-32 -mt-32"></div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
              <div className="flex items-center gap-4">
                <div className="bg-amber-400 p-3 rounded-2xl">
                  <Crown className="w-8 h-8 text-purple-900" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                  <p className="text-purple-200 mt-1 flex items-center gap-2 flex-wrap">
                    Selamat datang, {user.nama}
                    <span className="bg-amber-400 text-purple-900 px-3 py-0.5 rounded-full text-xs font-bold">
                      ADMIN
                    </span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Link
                  href="/admin"
                  className="flex-1 sm:flex-initial text-center px-4 py-2 bg-amber-400 text-purple-900 rounded-lg hover:bg-amber-300 transition font-semibold flex items-center justify-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  Panel Admin
                </Link>
                <LogoutButton variant="purple" />
              </div>
            </div>
          </div>

          {/* ADMIN STATS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {adminStats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition border-l-4 border-purple-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">{stat.label}</p>
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

          {/* ADMIN STATUS CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 font-medium">Menunggu</span>
                <span className="bg-gray-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                  {statusCounts.MENUNGGU || 0}
                </span>
              </div>
            </div>
            <div className="bg-gradient-to-r from-amber-100 to-amber-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <span className="text-amber-700 font-medium">Diproses</span>
                <span className="bg-amber-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                  {statusCounts.DIPROSES || 0}
                </span>
              </div>
            </div>
            <div className="bg-gradient-to-r from-green-100 to-green-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <span className="text-green-700 font-medium">Selesai</span>
                <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                  {statusCounts.SELESAI || 0}
                </span>
              </div>
            </div>
          </div>

          {/* ADMIN TABLE */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-purple-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Laporan Terbaru
            </h2>
            {renderTable(data.allReports, 'admin')}
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // ===== PETUGAS DASHBOARD =====
  // ============================================================
  if (user.role === 'PETUGAS') {
    const data = await fetchAdminOrPetugasData();
    const statusCounts: StatusCounts = data.laporanByStatus.reduce((acc, curr) => {
      acc[curr.status] = curr._count;
      return acc;
    }, {} as StatusCounts);

    const petugasStats = [
      { label: 'Total Laporan', value: data.totalLaporan, icon: ClipboardList, color: 'from-blue-500 to-blue-600' },
      { label: 'Menunggu Proses', value: statusCounts.MENUNGGU || 0, icon: Clock, color: 'from-amber-500 to-amber-600' },
      { label: 'Laporan Selesai', value: statusCounts.SELESAI || 0, icon: CheckCircle, color: 'from-emerald-500 to-emerald-600' },
      { label: 'Jenis Sampah', value: data.totalJenis, icon: Trash2, color: 'from-cyan-500 to-cyan-600' },
    ];

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl shadow-xl p-6 mb-8 text-white relative overflow-hidden">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
              <div className="flex items-center gap-4">
                <div className="bg-white p-3 rounded-2xl">
                  <Shield className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">Dashboard Petugas</h1>
                  <p className="text-blue-200 mt-1 flex items-center gap-2 flex-wrap">
                    Selamat datang, {user.nama}
                    <span className="bg-cyan-400 text-blue-900 px-3 py-0.5 rounded-full text-xs font-bold">
                      PETUGAS
                    </span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Link
                  href="/petugas/laporan"
                  className="flex-1 sm:flex-initial text-center px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition font-semibold flex items-center justify-center gap-2"
                >
                  <ClipboardList className="w-4 h-4" />
                  Kelola Laporan
                </Link>
                <LogoutButton variant="blue" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {petugasStats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition border-t-4 border-blue-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">{stat.label}</p>
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

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-blue-900 mb-4 flex items-center gap-2">
              <ClipboardList className="w-5 h-5" />
              Laporan Terbaru
            </h2>
            {renderTable(data.allReports, 'petugas')}
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // ===== MASYARAKAT DASHBOARD =====
  // ============================================================
  const { userLaporan, stats } = await fetchUserDashboardData(user.id);

  const masyarakatStats = [
    {
      label: 'Saldo Saya',
      value: `Rp ${stats.saldo.toLocaleString('id-ID')}`,
      icon: Wallet,
      color: 'from-emerald-500 to-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Total Reward',
      value: `Rp ${stats.totalReward.toLocaleString('id-ID')}`,
      icon: TrendingUp,
      color: 'from-green-500 to-green-600',
      bg: 'bg-green-50',
    },
    {
      label: 'Laporan Selesai',
      value: stats.selesai,
      icon: CheckCircle,
      color: 'from-amber-500 to-amber-600',
      bg: 'bg-amber-50',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-gradient-to-r from-emerald-600 to-green-700 rounded-2xl shadow-xl p-6 mb-8 text-white relative overflow-hidden">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
            <div className="flex items-center gap-4">
              <div className="bg-white p-3 rounded-2xl">
                <Leaf className="w-8 h-8 text-emerald-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Halo, {user.nama}! 🌿</h1>
                <p className="text-emerald-200 mt-1 flex items-center gap-2 flex-wrap">
                  <User className="w-4 h-4" />
                  Mari kita jaga bumi bersama!
                  <span className="bg-emerald-400 text-emerald-900 px-3 py-0.5 rounded-full text-xs font-bold">
                    MASYARAKAT
                  </span>
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <Link
                href="/masyarakat/transaksi"
                className="flex-1 sm:flex-initial text-center px-4 py-2 bg-amber-400 text-emerald-900 rounded-lg hover:bg-amber-300 transition font-semibold flex items-center justify-center gap-2 shadow-lg"
              >
                <Wallet className="w-4 h-4" />
                Dompet
              </Link>
              <Link
                href="/masyarakat/laporan"
                className="flex-1 sm:flex-initial text-center px-4 py-2 bg-white text-emerald-600 rounded-lg hover:bg-emerald-50 transition font-semibold flex items-center justify-center gap-2 shadow-lg"
              >
                <Plus className="w-4 h-4" />
                Lapor Sampah
              </Link>
              <LogoutButton variant="green" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {masyarakatStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className={`${stat.bg} rounded-2xl shadow-lg p-6 hover:shadow-xl transition border-2 border-white`}>
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

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-emerald-800 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Laporan Sampah Saya
          </h2>
          {userLaporan.length === 0 ? (
            <div className="text-center py-12">
              <Leaf className="w-16 h-16 text-emerald-200 mx-auto mb-4" />
              <p className="text-gray-500">Belum ada laporan sampah</p>
              <Link
                href="/masyarakat/laporan"
                className="inline-block mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
              >
                Buat Laporan Pertama
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userLaporan.map((report) => (
                <div key={report.id} className="border rounded-xl p-4 hover:shadow-md transition bg-gray-50 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-gray-800">{report.jenisSampah.namaJenis}</p>
                        <p className="text-sm text-gray-500">{report.wilayah.namaWilayah}</p>
                        <p className="text-sm font-medium text-emerald-600 mt-1">{report.berat} kg</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium
                        ${report.status === 'SELESAI' ? 'bg-green-100 text-green-700' :
                          report.status === 'DIPROSES' ? 'bg-blue-100 text-blue-700' :
                          'bg-amber-100 text-amber-700'}`}
                      >
                        {report.status}
                      </span>
                    </div>

                    {report.fotoSampah &&
                      report.fotoSampah.length > 0 &&
                      report.fotoSampah[0]?.imageUrl && (
                        <div className="mt-2 relative w-full h-36">
                          <Image
                            src={report.fotoSampah[0].imageUrl}
                            alt="Foto sampah"
                            fill
                            className="object-cover rounded-lg"
                            sizes="(max-width: 768px) 100vw, 33vw"
                          />
                        </div>
                      )}
                  </div>
                  <p className="text-xs text-gray-400 mt-3 pt-2 border-t border-gray-200">
                    {new Date(report.createdAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ===== HELPER: RENDER TABLE =====
function renderTable(reports: LaporanWithRelations[], role: 'admin' | 'petugas') {
  const isAdmin = role === 'admin';
  const headerColor = isAdmin ? 'text-purple-700 border-purple-100' : 'text-blue-700 border-blue-100';
  const hoverColor = isAdmin ? 'hover:bg-purple-50' : 'hover:bg-blue-50';

  if (reports.length === 0) {
    return <p className="text-gray-500 text-center py-8">Belum ada laporan</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className={`border-b ${headerColor}`}>
            <th className="text-left py-3 text-sm font-semibold">Pelapor</th>
            <th className="text-left py-3 text-sm font-semibold">Jenis Sampah</th>
            <th className="text-left py-3 text-sm font-semibold">Wilayah</th>
            <th className="text-left py-3 text-sm font-semibold">Berat</th>
            <th className="text-left py-3 text-sm font-semibold">Status</th>
            <th className="text-left py-3 text-sm font-semibold">Tanggal</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((report) => (
            <tr key={report.id} className={`border-b ${hoverColor} transition`}>
              <td className="py-3 text-sm">{report.user?.nama || '-'}</td>
              <td className="py-3 text-sm">{report.jenisSampah.namaJenis}</td>
              <td className="py-3 text-sm">{report.wilayah.namaWilayah}</td>
              <td className="py-3 text-sm font-medium">{report.berat} kg</td>
              <td className="py-3 text-sm">
                <span className={`px-2 py-1 rounded-full text-xs font-medium
                  ${report.status === 'SELESAI' ? 'bg-green-100 text-green-700' :
                    report.status === 'DIPROSES' ? 'bg-amber-100 text-amber-700' :
                    'bg-gray-100 text-gray-700'}`}
                >
                  {report.status}
                </span>
              </td>
              <td className="py-3 text-sm text-gray-500">
                {new Date(report.createdAt).toLocaleDateString('id-ID')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}