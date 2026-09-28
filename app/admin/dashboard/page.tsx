// app/admin/dashboard/page.tsx
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import LogoutButton from '@/components/LogoutButton';

// ===== ICONS =====
import {
  Crown, Settings, Clock,
  FileText, MapPin, Trash2, Users, Leaf, Sprout, ShieldCheck
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
};

type StatusCounts = Record<string, number>;

// ===== METADATA =====
export const metadata = {
  title: 'Admin Dashboard - Earth Keeper',
  description: 'Panel Pengelolaan Admin',
};

// ===== REVALIDATION =====
export const revalidate = 60;

// ===== FETCH FUNCTIONS =====
async function fetchAdminDashboardData() {
  try {
    const [
      totalLaporan,
      totalUser,
      totalWilayah,
      totalJenis,
      laporanByStatus,
    ] = await Promise.all([
      prisma.laporanSampah.count(),
      prisma.user.count(),
      prisma.wilayah.count(),
      prisma.jenisSampah.count(),
      prisma.laporanSampah.groupBy({
        by: ['status'],
        _count: true,
      }),
    ]);

    return { totalLaporan, totalUser, totalWilayah, totalJenis, laporanByStatus };
  } catch (error) {
    console.error('Error fetching admin dashboard data:', error);
    throw new Error('Failed to fetch admin dashboard data');
  }
}

async function fetchAllReports(): Promise<LaporanWithRelations[]> {
  try {
    return await prisma.laporanSampah.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        berat: true,
        status: true,
        createdAt: true,
        user: {
          select: { nama: true },
        },
        jenisSampah: {
          select: { namaJenis: true },
        },
        wilayah: {
          select: { namaWilayah: true },
        },
      },
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    return [];
  }
}

// ===== MAIN COMPONENT =====
export default async function AdminDashboardPage() {
  const user = await getCurrentUser();

  // Redirection & Proteksi Akses
  if (!user) {
    redirect('/login');
  }

  if (user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const dashboardData = await fetchAdminDashboardData();
  const allReports = await fetchAllReports();

  const statusCounts: StatusCounts = dashboardData.laporanByStatus.reduce((acc, curr) => {
    acc[curr.status] = curr._count;
    return acc;
  }, {} as StatusCounts);

  const adminStats = [
    { label: 'Total Laporan', value: dashboardData.totalLaporan, icon: FileText, color: 'from-emerald-600 to-teal-700' },
    { label: 'Total Pengguna', value: dashboardData.totalUser, icon: Users, color: 'from-green-600 to-emerald-700' },
    { label: 'Total Wilayah', value: dashboardData.totalWilayah, icon: MapPin, color: 'from-teal-600 to-emerald-800' },
    { label: 'Jenis Sampah', value: dashboardData.totalJenis, icon: Trash2, color: 'from-lime-600 to-emerald-700' },
  ];

  return (
    <div className="min-h-screen bg-emerald-50/40 text-emerald-950">
      <div className="container mx-auto px-4 py-8">
        
        {/* ADMIN HEADER ALAM */}
        <div className="bg-gradient-to-r from-emerald-800 via-green-800 to-teal-900 rounded-3xl shadow-xl p-6 md:p-8 mb-8 text-white relative overflow-hidden border border-emerald-700/30">
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500 rounded-full opacity-10 blur-2xl -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-60 h-60 bg-lime-400 rounded-full opacity-10 blur-xl -ml-24 -mb-24"></div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
            <div className="flex items-center gap-4">
              <div className="bg-emerald-700/50 backdrop-blur-md p-3.5 rounded-2xl border border-emerald-500/30 shadow-inner">
                <Crown className="w-8 h-8 text-lime-300" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                  Admin Control Panel <Leaf className="w-6 h-6 text-lime-400 inline" />
                </h1>
                <p className="text-emerald-100/90 mt-1 flex items-center gap-2 flex-wrap text-sm">
                  Selamat datang kembali, <span className="font-semibold text-white">{user.nama}</span>
                  <span className="bg-lime-400/20 text-lime-200 border border-lime-400/30 px-3 py-0.5 rounded-full text-xs font-bold tracking-wider">
                    ADMINISTOR
                  </span>
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Link
                href="/admin"
                className="flex-1 sm:flex-initial text-center px-4 py-2.5 bg-lime-400 text-emerald-950 rounded-xl hover:bg-lime-300 transition font-semibold text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-950/20"
                aria-label="Panel Admin"
              >
                <Settings className="w-4 h-4" />
                Kelola Sistem
              </Link>
              <LogoutButton variant="green" />
            </div>
          </div>
        </div>

        {/* STATS CARDS ALAM */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {adminStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div 
                key={index} 
                className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-emerald-100 p-6 hover:shadow-md transition hover:border-emerald-300 group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold tracking-wider text-emerald-700/70 uppercase">{stat.label}</p>
                    <p className="text-3xl font-extrabold text-emerald-900 mt-2 group-hover:text-emerald-600 transition">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`bg-gradient-to-br ${stat.color} p-3.5 rounded-2xl shadow-md text-white`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* STATUS CARDS ALAM */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-emerald-900/5 border border-emerald-200/60 rounded-2xl p-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-emerald-700" />
              <span className="text-emerald-900 font-semibold text-sm">Menunggu</span>
            </div>
            <span className="bg-emerald-700 text-white px-3 py-1 rounded-full text-xs font-bold">
              {statusCounts.MENUNGGU || 0}
            </span>
          </div>

          <div className="bg-amber-500/10 border border-amber-200/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <Sprout className="w-5 h-5 text-amber-700" />
              <span className="text-amber-900 font-semibold text-sm">Sedang Diproses</span>
            </div>
            <span className="bg-amber-600 text-white px-3 py-1 rounded-full text-xs font-bold">
              {statusCounts.DIPROSES || 0}
            </span>
          </div>

          <div className="bg-green-600/10 border border-green-200/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-green-700" />
              <span className="text-green-900 font-semibold text-sm">Selesai Ditangani</span>
            </div>
            <span className="bg-green-700 text-white px-3 py-1 rounded-full text-xs font-bold">
              {statusCounts.SELESAI || 0}
            </span>
          </div>
        </div>

        {/* TABLE CONTAINERS ALAM */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-sm border border-emerald-100 p-6 md:p-8">
          <h2 className="text-xl font-bold text-emerald-900 mb-6 flex items-center gap-2">
            <Leaf className="w-5 h-5 text-emerald-600" />
            Laporan Terbaru Masuk
          </h2>
          {renderTable(allReports)}
        </div>

      </div>
    </div>
  );
}

// ===== HELPER: RENDER TABLE ALAM =====
function renderTable(reports: LaporanWithRelations[]) {
  if (reports.length === 0) {
    return (
      <div className="text-center py-12 bg-emerald-50/50 rounded-2xl border border-dashed border-emerald-200">
        <Leaf className="w-12 h-12 text-emerald-300 mx-auto mb-2" />
        <p className="text-emerald-700 font-medium">Belum ada laporan terbaru</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider bg-emerald-50/60">
            <th className="py-4 px-4 rounded-l-xl">Pelapor</th>
            <th className="py-4 px-4">Jenis Sampah</th>
            <th className="py-4 px-4">Wilayah</th>
            <th className="py-4 px-4">Berat</th>
            <th className="py-4 px-4">Status</th>
            <th className="py-4 px-4 rounded-r-xl">Tanggal</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-emerald-100/60">
          {reports.map((report) => (
            <tr key={report.id} className="hover:bg-emerald-50/50 transition">
              <td className="py-4 px-4 text-sm font-medium text-emerald-950">{report.user?.nama || '-'}</td>
              <td className="py-4 px-4 text-sm text-emerald-900">{report.jenisSampah.namaJenis}</td>
              <td className="py-4 px-4 text-sm text-emerald-800">{report.wilayah.namaWilayah}</td>
              <td className="py-4 px-4 text-sm font-bold text-emerald-700">{report.berat} kg</td>
              <td className="py-4 px-4 text-sm">
                <span className={`px-3 py-1 rounded-full text-xs font-bold inline-block
                  ${report.status === 'SELESAI' ? 'bg-green-100 text-green-800 border border-green-200' :
                    report.status === 'DIPROSES' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                    'bg-emerald-100/70 text-emerald-800 border border-emerald-200'}`}
                >
                  {report.status}
                </span>
              </td>
              <td className="py-4 px-4 text-sm text-emerald-600/80 font-medium">
                {new Date(report.createdAt).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}