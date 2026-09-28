// app/masyarakat/transaksi/page.tsx

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Wallet, ArrowLeft, TrendingUp, TrendingDown,
  Calendar, Loader2, AlertCircle, Receipt
} from 'lucide-react'

interface Transaksi {
  id: string
  tipe: 'MASUK' | 'KELUAR'
  jumlah: number
  keterangan: string
  status: string
  createdAt: string
  laporan: {
    berat: number
    jenisSampah: { namaJenis: string }
    wilayah: { namaWilayah: string }
  } | null
}

export default function TransaksiPage() {
  const [transaksi, setTransaksi] = useState<Transaksi[]>([])
  const [saldo, setSaldo] = useState(0)
  const [totalReward, setTotalReward] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [transaksiRes, saldoRes] = await Promise.all([
        fetch('/api/transaksi'),
        fetch('/api/user/saldo'),
      ])

      if (!transaksiRes.ok || !saldoRes.ok) {
        throw new Error('Gagal memuat data')
      }

      const transaksiData = await transaksiRes.json()
      const saldoData = await saldoRes.json()

      setTransaksi(transaksiData)
      setSaldo(saldoData.saldo)
      setTotalReward(saldoData.totalReward)
    } catch (err) {
      console.error(err)
      setError('Gagal memuat data transaksi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 p-4">
      <div className="container mx-auto max-w-4xl">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-emerald-600 transition mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Dashboard
        </Link>

        {/* HEADER SALDO */}
        <div className="bg-gradient-to-r from-emerald-600 to-green-700 rounded-2xl shadow-xl p-6 mb-6 text-white">
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-white p-3 rounded-2xl">
              <Wallet className="w-8 h-8 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Dompet Saya</h1>
              <p className="text-emerald-200 text-sm">Saldo reward dari laporan sampah</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/20">
              <p className="text-emerald-100 text-sm mb-1">Saldo Saat Ini</p>
              <p className="text-3xl font-bold">
                Rp {saldo.toLocaleString('id-ID')}
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/20">
              <p className="text-emerald-100 text-sm mb-1">Total Reward</p>
              <p className="text-3xl font-bold">
                Rp {totalReward.toLocaleString('id-ID')}
              </p>
            </div>
          </div>
        </div>

        {/* ERROR */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm mb-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* RIWAYAT */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-emerald-800 mb-4 flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Riwayat Transaksi
          </h2>

          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mx-auto mb-3" />
              <p className="text-gray-500">Memuat transaksi...</p>
            </div>
          ) : transaksi.length === 0 ? (
            <div className="text-center py-12">
              <Wallet className="w-16 h-16 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Belum ada transaksi</p>
              <p className="text-sm text-gray-400 mt-1">
                Selesaikan laporan sampah untuk dapat reward
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {transaksi.map((trx) => (
                <div
                  key={trx.id}
                  className={`border rounded-xl p-4 flex items-start gap-4 hover:shadow-md transition ${
                    trx.status === 'GAGAL'
                      ? 'bg-red-50 border-red-200 opacity-60'
                      : trx.tipe === 'MASUK'
                      ? 'bg-emerald-50 border-emerald-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  {/* Icon */}
                  <div className={`p-2.5 rounded-xl flex-shrink-0 ${
                    trx.status === 'GAGAL'
                      ? 'bg-red-200 text-red-700'
                      : trx.tipe === 'MASUK'
                      ? 'bg-emerald-200 text-emerald-700'
                      : 'bg-red-200 text-red-700'
                  }`}>
                    {trx.tipe === 'MASUK' ? (
                      <TrendingUp className="w-5 h-5" />
                    ) : (
                      <TrendingDown className="w-5 h-5" />
                    )}
                  </div>

                  {/* Detail */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-800 truncate">
                          {trx.keterangan}
                        </p>
                        {trx.laporan && (
                          <p className="text-sm text-gray-500 mt-0.5">
                            {trx.laporan.berat} kg • {trx.laporan.jenisSampah.namaJenis} • {trx.laporan.wilayah.namaWilayah}
                          </p>
                        )}
                        <div className="flex items-center gap-2 text-xs text-gray-400 mt-2">
                          <Calendar className="w-3 h-3" />
                          <span>
                            {new Date(trx.createdAt).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <p className={`font-bold text-lg ${
                          trx.status === 'GAGAL'
                            ? 'text-gray-500 line-through'
                            : trx.tipe === 'MASUK'
                            ? 'text-emerald-600'
                            : 'text-red-600'
                        }`}>
                          {trx.tipe === 'MASUK' ? '+' : '-'}
                          Rp {trx.jumlah.toLocaleString('id-ID')}
                        </p>
                        {trx.status === 'GAGAL' && (
                          <span className="inline-block mt-1 px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                            DIBATALKAN
                          </span>
                        )}
                        {trx.status === 'BERHASIL' && (
                          <span className="inline-block mt-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
                            BERHASIL
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}