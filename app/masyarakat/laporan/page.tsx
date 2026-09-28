'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Leaf, Upload, X, MapPin, Trash2, Scale, 
  ArrowLeft, CheckCircle, AlertCircle, Info,
  Camera, FileImage, Loader2
} from 'lucide-react';

// ===== TYPES =====
interface JenisSampah {
  id: string;
  namaJenis: string;
  deskripsi?: string;
}

interface Wilayah {
  id: string;
  namaWilayah: string;
  deskripsi?: string;
}

interface FormData {
  berat: string;
  jenisSampahId: string;
  wilayahId: string;
}

// ===== MAIN COMPONENT =====
export default function BuatLaporanPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [jenisSampah, setJenisSampah] = useState<JenisSampah[]>([]);
  const [wilayah, setWilayah] = useState<Wilayah[]>([]);
  const [foto, setFoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [form, setForm] = useState<FormData>({
    berat: '',
    jenisSampahId: '',
    wilayahId: '',
  });

  // ===== FETCH DATA =====
  const fetchData = useCallback(async () => {
    try {
      const [jenisRes, wilayahRes] = await Promise.all([
        fetch('/api/jenis-sampah'),
        fetch('/api/wilayah'),
      ]);

      if (!jenisRes.ok || !wilayahRes.ok) {
        throw new Error('Gagal memuat data');
      }

      const jenisData = await jenisRes.json();
      const wilayahData = await wilayahRes.json();

      setJenisSampah(jenisData);
      setWilayah(wilayahData);
    } catch (err: unknown) {
      console.error('Error fetching data:', err);
      setError('Gagal memuat data. Silakan refresh halaman.');
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ===== FILE HANDLING =====
  const validateAndSetFile = (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      setError('Ukuran foto maksimal 5MB');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Format foto harus JPG, PNG, atau WEBP');
      return;
    }

    setFoto(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    setError('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const removeFoto = () => {
    setFoto(null);
    setPreview(null);
    const fileInput = document.getElementById('foto') as HTMLInputElement | null;
    if (fileInput) fileInput.value = '';
  };

  // ===== DRAG AND DROP =====
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  // ===== SUBMIT =====
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const beratNum = parseFloat(form.berat);
    if (isNaN(beratNum) || beratNum <= 0) {
      setError('Berat sampah harus lebih dari 0 kg');
      setLoading(false);
      return;
    }

    if (beratNum > 1000) {
      setError('Berat sampah maksimal 1000 kg');
      setLoading(false);
      return;
    }

    if (!foto) {
      setError('Foto sampah wajib diupload');
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('berat', form.berat);
      formData.append('jenisSampahId', form.jenisSampahId);
      formData.append('wilayahId', form.wilayahId);
      formData.append('foto', foto);

      const res = await fetch('/api/laporan', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Gagal membuat laporan');
      }

      setSuccess('✅ Laporan berhasil dibuat!');
      setForm({ berat: '', jenisSampahId: '', wilayahId: '' });
      setFoto(null);
      setPreview(null);
      
      const fileInput = document.getElementById('foto') as HTMLInputElement | null;
      if (fileInput) fileInput.value = '';

      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Terjadi kesalahan saat membuat laporan');
      }
    } finally {
      setLoading(false);
    }
  };

  // ===== RENDER =====
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 p-4">
      <div className="container mx-auto max-w-2xl">
        {/* BACK BUTTON */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-emerald-600 transition mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Dashboard
        </Link>

        {/* MAIN CARD */}
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border border-emerald-100">
          {/* HEADER */}
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
            <div className="bg-emerald-100 p-3 rounded-xl">
              <Leaf className="w-8 h-8 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Buat Laporan Sampah</h1>
              <p className="text-sm text-gray-500">Laporkan sampah untuk membantu lingkungan</p>
            </div>
          </div>

          {/* ALERT MESSAGES */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg text-sm mb-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-lg text-sm mb-4 flex items-start gap-3">
              <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          {/* FORM */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Jenis Sampah */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Jenis Sampah <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Trash2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
                <select
                  required
                  value={form.jenisSampahId}
                  onChange={(e) => setForm({ ...form, jenisSampahId: e.target.value })}
                  className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 appearance-none cursor-pointer"
                  style={{ color: '#111827', backgroundColor: '#ffffff' }}
                >
                  <option 
                    value="" 
                    className="text-gray-900 bg-white"
                    style={{ color: '#111827', backgroundColor: '#ffffff' }}
                  >
                    Pilih Jenis Sampah
                  </option>
                  {jenisSampah.map((item) => (
                    <option 
                      key={item.id} 
                      value={item.id}
                      className="text-gray-900 bg-white"
                      style={{ color: '#111827', backgroundColor: '#ffffff' }}
                    >
                      {item.namaJenis} {item.deskripsi ? `- ${item.deskripsi}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Wilayah */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Wilayah <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
                <select
                  required
                  value={form.wilayahId}
                  onChange={(e) => setForm({ ...form, wilayahId: e.target.value })}
                  className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 appearance-none cursor-pointer"
                  style={{ color: '#111827', backgroundColor: '#ffffff' }}
                >
                  <option 
                    value="" 
                    className="text-gray-900 bg-white"
                    style={{ color: '#111827', backgroundColor: '#ffffff' }}
                  >
                    Pilih Wilayah
                  </option>
                  {wilayah.map((item) => (
                    <option 
                      key={item.id} 
                      value={item.id}
                      className="text-gray-900 bg-white"
                      style={{ color: '#111827', backgroundColor: '#ffffff' }}
                    >
                      {item.namaWilayah} {item.deskripsi ? `- ${item.deskripsi}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Berat */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Berat Sampah (kg) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Scale className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  required
                  step="0.1"
                  min="0.1"
                  max="1000"
                  value={form.berat}
                  onChange={(e) => setForm({ ...form, berat: e.target.value })}
                  className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 bg-white"
                  placeholder="Contoh: 2.5"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">Maksimal 1000 kg</p>
            </div>

            {/* Foto */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Foto Sampah <span className="text-red-500">*</span>
              </label>
              
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-4 text-center transition ${
                  isDragging
                    ? 'border-emerald-500 bg-emerald-50'
                    : preview
                    ? 'border-emerald-300 bg-emerald-50/50'
                    : 'border-gray-300 hover:border-emerald-400'
                }`}
              >
                {preview ? (
                  <div className="relative">
                    <div className="relative w-full max-h-64 mx-auto">
                      <Image
                        src={preview}
                        alt="Preview foto sampah"
                        width={400}
                        height={300}
                        className="rounded-lg object-contain max-h-64 w-auto mx-auto"
                        unoptimized
                      />
                    </div>
                    <button
                      type="button"
                      onClick={removeFoto}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 transition shadow-lg"
                      aria-label="Hapus foto"
                    >
                      <X className="w-5 h-5" />
                    </button>
                    {foto && (
                      <p className="text-sm text-gray-500 mt-2">
                        <FileImage className="w-4 h-4 inline mr-1" />
                        {foto.name} ({(foto.size / 1024).toFixed(1)} KB)
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="py-8">
                    <div className="bg-emerald-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Camera className="w-8 h-8 text-emerald-600" />
                    </div>
                    <p className="text-gray-600 font-medium">
                      Klik atau seret untuk upload foto
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      JPG, PNG, WEBP • Maksimal 5MB
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      id="foto"
                      name="foto"
                    />
                    <label
                      htmlFor="foto"
                      className="inline-block mt-4 px-6 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 cursor-pointer transition shadow-md hover:shadow-lg"
                    >
                      <Upload className="w-4 h-4 inline mr-2" />
                      Pilih Foto
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* INFO */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-blue-700">
                <p className="font-semibold">Informasi:</p>
                <p>Laporan akan diproses oleh petugas. Pastikan data yang dimasukkan akurat.</p>
              </div>
            </div>

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-600 to-green-600 text-white py-3 rounded-xl font-semibold hover:from-emerald-700 hover:to-green-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Mengirim...
                </>
              ) : (
                <>
                  <Leaf className="w-5 h-5" />
                  Kirim Laporan
                </>
              )}
            </button>
          </form>
        </div>

        {/* TIPS */}
        <div className="mt-6 bg-white rounded-xl shadow p-4 border border-emerald-100">
          <div className="flex items-start gap-3">
            <div className="bg-emerald-100 p-2 rounded-lg">
              <Info className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-700">Tips Melaporkan:</h4>
              <ul className="text-xs text-gray-500 mt-1 space-y-1">
                <li>• Foto harus jelas dan menunjukkan kondisi sampah</li>
                <li>• Pastikan berat sampah sesuai (minimal 0.1 kg)</li>
                <li>• Pilih jenis sampah dan wilayah dengan benar</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}