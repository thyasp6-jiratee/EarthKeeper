// app/petugas/laporan/page.tsx

'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  ClipboardList, ArrowLeft, Clock, CheckCircle, AlertCircle,
  Trash2, MapPin, Scale, User, Filter, Loader2, Eye, X,
  RefreshCw, Calendar, ImageOff
} from 'lucide-react'

// ===== TYPES =====
interface Laporan {
  id: string
  berat: number
  status: 'MENUNGGU' | 'DIPROSES' | 'SELESAI'
  createdAt: string
  user: { nama: string; email: string; noHp: string }
  jenisSampah: { namaJenis: string }
  wilayah: { namaWilayah: string }
  fotoSampah: { imageUrl: string } | null
}

type FilterStatus = 'SEMUA' | 'MENUNGGU' | 'DIPROSES' | 'SELESAI'

// ===== HELPER: Cek URL valid =====
const hasValidImage = (foto: { imageUrl: string } | null): boolean => {
  if (!foto) return false
  if (!foto.imageUrl) return false
  if (typeof foto.imageUrl !== 'string') return false
  if (foto.imageUrl.trim() === '') return false
  return true
}

// ===== MAIN COMPONENT =====
export default function PetugasLaporanPage() {
  const [laporan, setLaporan] = useState<Laporan[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [filter, setFilter] = useState<FilterStatus>('SEMUA')
  const [selectedLaporan, setSelectedLaporan] = useState<Laporan | null>(null)

  const fetchLaporan = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/laporan')
      if (!res.ok) throw new Error('Gagal memuat data')
      const data = await res.json()
      setLaporan(data)
    } catch (err: unknown) {
      console.error('Error fetching laporan:', err)
      setError('Gagal memuat laporan. Coba refresh halaman.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLaporan()
  }, [fetchLaporan])

  const updateStatus = async (id: string, newStatus: string) => {
    setActionLoading(id)
    setError('')
    setSuccess('')
    try {
      const res = await fetch(`/api/laporan/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal update status')
      setSuccess(`✅ Status berhasil diubah ke ${newStatus}`)
      await fetchLaporan()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message)
      else setError('Terjadi kesalahan')
    } finally {
      setActionLoading(null)
    }
  }

  const deleteLaporan = async (id: string) => {
    if (!confirm('Yakin mau hapus laporan ini?')) return
    setActionLoading(id)
    setError('')
    setSuccess('')
    try {
      const res = await fetch(`/api/laporan/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal hapus laporan')
      setSuccess('✅ Laporan berhasil dihapus')
      await fetchLaporan()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message)
      else setError('Terjadi kesalahan')
    } finally {
      setActionLoading(null)
    }
  }

  const filteredLaporan = laporan.filter((l) => {
    if (filter === 'SEMUA') return true
    return l.status === filter
  })

  const stats = {
    total: laporan.length,
    menunggu: laporan.filter((l) => l.status === 'MENUNGGU').length,
    diproses: laporan.filter((l) => l.status === 'DIPROSES').length,
    selesai: laporan.filter((l) => l.status === 'SELESAI').length,
  }

  const StatusBadge = ({ status }: { status: string }) => {
    const styles = {
      MENUNGGU: 'bg-amber-100 text-amber-700 border-amber-200',
      DIPROSES: 'bg-blue-100 text-blue-700 border-blue-200',
      SELESAI: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    }
    const icons = {
      MENUNGGU: <Clock className="w-3 h-3" />,
      DIPROSES: <AlertCircle className="w-3 h-3" />,
      SELESAI: <CheckCircle className="w-3 h-3" />,
    }
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold border ${styles[status as keyof typeof styles]}`}>
        {icons[status as keyof typeof icons]}
        {status}
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-4">
      <div className="container mx-auto max-w-7xl">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 transition mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Dashboard
        </Link>

        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl shadow-xl p-6 mb-6 text-white">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-white p-3 rounded-xl">
                <ClipboardList className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Kelola Laporan</h1>
                <p className="text-blue-200 text-sm">Kelola dan proses laporan sampah dari masyarakat</p>
              </div>
            </div>
            <button
              onClick={fetchLaporan}
              disabled={loading}
              className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition font-semibold flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm mb-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl text-sm mb-4 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow p-4 border-l-4 border-gray-400">
            <p className="text-xs text-gray-500 font-medium">Total</p>
            <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
          </div>
          <div className="bg-white rounded-xl shadow p-4 border-l-4 border-amber-400">
            <p className="text-xs text-gray-500 font-medium">Menunggu</p>
            <p className="text-2xl font-bold text-amber-600">{stats.menunggu}</p>
          </div>
          <div className="bg-white rounded-xl shadow p-4 border-l-4 border-blue-400">
            <p className="text-xs text-gray-500 font-medium">Diproses</p>
            <p className="text-2xl font-bold text-blue-600">{stats.diproses}</p>
          </div>
          <div className="bg-white rounded-xl shadow p-4 border-l-4 border-emerald-400">
            <p className="text-xs text-gray-500 font-medium">Selesai</p>
            <p className="text-2xl font-bold text-emerald-600">{stats.selesai}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-4 mb-6">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-gray-600">
              <Filter className="w-4 h-4" />
              <span className="text-sm font-semibold">Filter:</span>
            </div>
            {(['SEMUA', 'MENUNGGU', 'DIPROSES', 'SELESAI'] as FilterStatus[]).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
                  filter === status
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-xl shadow p-12 text-center">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-3" />
            <p className="text-gray-500">Memuat laporan...</p>
          </div>
        ) : filteredLaporan.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-12 text-center">
            <ClipboardList className="w-16 h-16 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">
              {filter === 'SEMUA' 
                ? 'Belum ada laporan sampah' 
                : `Tidak ada laporan dengan status ${filter}`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLaporan.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl shadow-md hover:shadow-lg transition overflow-hidden border border-gray-100"
              >
                {/* ✅ FIX: Pakai hasValidImage() biar aman */}
                {hasValidImage(item.fotoSampah) ? (
                  <div className="relative w-full h-48 bg-gray-100">
                    <Image
                      src={item.fotoSampah!.imageUrl}
                      alt="Foto sampah"
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                    <div className="absolute top-2 right-2">
                      <StatusBadge status={item.status} />
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-48 bg-gray-100 flex flex-col items-center justify-center gap-2">
                    <ImageOff className="w-10 h-10 text-gray-300" />
                    <p className="text-gray-400 text-sm">Foto tidak tersedia</p>
                  </div>
                )}

                <div className="p-4">
                  <div className="mb-3">
                    <div className="flex items-center gap-2 text-gray-800 font-semibold">
                      <Trash2 className="w-4 h-4 text-blue-500" />
                      <span>{item.jenisSampah.namaJenis}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                      <MapPin className="w-4 h-4" />
                      <span>{item.wilayah.namaWilayah}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Scale className="w-4 h-4 text-emerald-500" />
                      <span className="font-semibold">{item.berat} kg</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 truncate">
                      <User className="w-4 h-4 text-purple-500" />
                      <span className="truncate">{item.user.nama}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-400 mb-4 pb-3 border-b border-gray-100">
                    <Calendar className="w-3 h-3" />
                    <span>
                      {new Date(item.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {item.status === 'MENUNGGU' && (
                      <button
                        onClick={() => updateStatus(item.id, 'DIPROSES')}
                        disabled={actionLoading === item.id}
                        className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium flex items-center justify-center gap-1 disabled:opacity-50"
                      >
                        {actionLoading === item.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <AlertCircle className="w-4 h-4" />
                            Proses
                          </>
                        )}
                      </button>
                    )}

                    {item.status === 'DIPROSES' && (
                      <button
                        onClick={() => updateStatus(item.id, 'SELESAI')}
                        disabled={actionLoading === item.id}
                        className="flex-1 px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition text-sm font-medium flex items-center justify-center gap-1 disabled:opacity-50"
                      >
                        {actionLoading === item.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            Selesai
                          </>
                        )}
                      </button>
                    )}

                    {item.status === 'SELESAI' && (
                      <div className="flex-1 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium flex items-center justify-center gap-1 border border-emerald-200">
                        <CheckCircle className="w-4 h-4" />
                        Selesai
                      </div>
                    )}

                    <button
                      onClick={() => setSelectedLaporan(item)}
                      className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition"
                      title="Lihat detail"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => deleteLaporan(item.id)}
                      disabled={actionLoading === item.id}
                      className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition disabled:opacity-50"
                      title="Hapus laporan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedLaporan && (
          <div 
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedLaporan(null)}
          >
            <div 
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-800">Detail Laporan</h3>
                <button
                  onClick={() => setSelectedLaporan(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              <div className="p-6">
                {/* ✅ FIX: Cek valid image dulu */}
                {hasValidImage(selectedLaporan.fotoSampah) ? (
                  <div className="relative w-full h-64 mb-4 rounded-xl overflow-hidden">
                    <Image
                      src={selectedLaporan.fotoSampah!.imageUrl}
                      alt="Foto sampah"
                      fill
                      className="object-contain bg-gray-100"
                      sizes="(max-width: 768px) 100vw, 600px"
                    />
                  </div>
                ) : (
                  <div className="w-full h-64 mb-4 rounded-xl bg-gray-100 flex flex-col items-center justify-center gap-2">
                    <ImageOff className="w-12 h-12 text-gray-300" />
                    <p className="text-gray-400 text-sm">Foto tidak tersedia</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Jenis Sampah</p>
                    <p className="font-semibold text-gray-800">{selectedLaporan.jenisSampah.namaJenis}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Wilayah</p>
                    <p className="font-semibold text-gray-800">{selectedLaporan.wilayah.namaWilayah}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Berat</p>
                    <p className="font-semibold text-gray-800">{selectedLaporan.berat} kg</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Status</p>
                    <StatusBadge status={selectedLaporan.status} />
                  </div>
                  <div className="col-span-2 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">Pelapor</p>
                    <p className="font-semibold text-gray-800">{selectedLaporan.user.nama}</p>
                    <p className="text-sm text-gray-500">{selectedLaporan.user.email}</p>
                    <p className="text-sm text-gray-500">{selectedLaporan.user.noHp}</p>
                  </div>
                  <div className="col-span-2 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">Tanggal Lapor</p>
                    <p className="font-semibold text-gray-800">
                      {new Date(selectedLaporan.createdAt).toLocaleDateString('id-ID', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}