import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Upload, Database, RefreshCw, Calendar, Check, X,
  Trash2, ShieldCheck, Play, Sliders, List, Network, Plus, Sparkles
} from 'lucide-react';
import { AdminDashboardData, Booking, NailDesign } from '../types';

interface AdminSectionProps {
  designs: NailDesign[];
  onLogout: () => void;
}

export default function AdminSection({ designs, onLogout }: AdminSectionProps) {
  const [activeTab, setActiveTab] = useState<'bookings' | 'training' | 'itemsets'>('bookings');
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Training parameters state
  const [minSupport, setMinSupport] = useState(0.1);
  const [minConfidence, setMinConfidence] = useState(0.3);

  // Manual transaction builder state
  const [manualTransaction, setManualTransaction] = useState<string[]>([]);

  // CSV Drag and Drop State
  const [isDragging, setIsDragging] = useState(false);

  // Fetch admin dashboard details
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/dashboard');
      if (!response.ok) throw new Error("Gagal mengambil data dashboard.");
      const result: AdminDashboardData = await response.json();
      setData(result);
      setMinSupport(result.config.minSupport);
      setMinConfidence(result.config.minConfidence);
    } catch (err: any) {
      setError(err.message || "Gagal menghubungi server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleUpdateStatus = async (id: string, status: 'completed' | 'cancelled') => {
    try {
      const response = await fetch(`/api/admin/bookings/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const result = await response.json();

      if (!response.ok) throw new Error(result.error || "Gagal memperbarui status.");

      setSuccessMsg(`Reservasi berhasil diubah menjadi ${status === 'completed' ? 'Selesai' : 'Batal'}.`);
      if (result.autoRetrained) {
        setSuccessMsg(prev => prev + " 🔄 Sistem Apriori mendeteksi 20 transaksi baru dan telah melatih ulang model secara otomatis!");
      }
      fetchDashboardData();
    } catch (err: any) {
      setError(err.message || "Koneksi gagal.");
    }
  };

  const handleTrainModel = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const response = await fetch('/api/admin/train', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ minSupport, minConfidence })
      });
      const result = await response.json();

      if (!response.ok) throw new Error(result.error || "Gagal melatih model.");

      setSuccessMsg(`Model berhasil dilatih! Menghasilkan ${result.frequentSetsCount} Itemset dan ${result.rulesCount} Aturan Asosiasi baru.`);
      fetchDashboardData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleManualTransactionAdd = async () => {
    if (manualTransaction.length === 0) {
      setError("Silakan pilih minimal 1 item untuk transaksi manual.");
      return;
    }
    setError(null);
    setSuccessMsg(null);

    try {
      const response = await fetch('/api/admin/add-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: manualTransaction })
      });
      const result = await response.json();

      if (!response.ok) throw new Error(result.error || "Gagal menyimpan transaksi.");

      setSuccessMsg("Transaksi manual berhasil direkam.");
      if (result.autoRetrained) {
        setSuccessMsg(prev => prev + " 🔄 Sistem Apriori otomatis melatih ulang model setelah mencapai kelipatan 20 transaksi baru!");
      }
      setManualTransaction([]);
      fetchDashboardData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    processCSVFile(file);
  };

  const processCSVFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      if (!text) return;

      setLoading(true);
      setError(null);
      setSuccessMsg(null);

      try {
        const response = await fetch('/api/admin/upload-csv', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            csvText: text,
            minSupport,
            minConfidence
          })
        });
        const result = await response.json();

        if (!response.ok) throw new Error(result.error || "Gagal mengupload CSV.");

        setSuccessMsg(`Berhasil mengimpor CSV! Sistem mengunggah ${result.transactionsCount} transaksi, dan melatih ulang model baru.`);
        fetchDashboardData();
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processCSVFile(file);
    }
  };

  const toggleManualItemSelection = (id: string) => {
    setManualTransaction(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="py-10 px-4 max-w-7xl mx-auto text-left" id="admin-panel">
      {/* Admin Title Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-5 border-b border-[#FCE2E8]">
        <div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#FF5376] bg-[#FFF0F4] border border-[#FCD5DF] rounded-full px-3 py-1 uppercase tracking-wider mb-1.5 w-fit">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>KONSOL ADMINISTRATOR NAILOVE</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#2D1F24] tracking-tight">
            Dashboard Pengelola &amp; Apriori Engine
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboardData}
            className="p-2 bg-white border border-[#FCE2E8] text-[#2D1F24] rounded-full hover:bg-[#FFF0F4] transition-all cursor-pointer shadow-2xs"
            title="Muat Ulang Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onLogout}
            className="py-2 px-4 bg-red-50 text-red-600 border border-red-200 text-xs font-bold rounded-full hover:bg-red-100 transition-all cursor-pointer"
          >
            Keluar (Logout)
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {data && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-[#FCE2E8] p-5 rounded-2xl shadow-2xs">
            <span className="text-[#8C727D] text-[10px] block uppercase font-bold tracking-wider">Total Transaksi</span>
            <span className="text-2xl font-bold text-[#2D1F24] block mt-1">{data.totalTransactions} Tx</span>
            <div className="text-[10px] text-emerald-600 font-semibold mt-1.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
              SQLite Dataset Aktif
            </div>
          </div>

          <div className="bg-white border border-[#FCE2E8] p-5 rounded-2xl shadow-2xs">
            <span className="text-[#8C727D] text-[10px] block uppercase font-bold tracking-wider">Transaksi Baru</span>
            <span className="text-2xl font-bold text-[#FF5376] block mt-1">
              {data.newTransactionsSinceLastTrain} <span className="text-xs text-[#8C727D]">/ 20</span>
            </span>
            <div className="text-[10px] text-[#FF5376] mt-1.5 font-bold">
              🔄 Retrain di 20 Tx
            </div>
          </div>

          <div className="bg-white border border-[#FCE2E8] p-5 rounded-2xl shadow-2xs">
            <span className="text-[#8C727D] text-[10px] block uppercase font-bold tracking-wider">Total Reservasi</span>
            <span className="text-2xl font-bold text-[#2D1F24] block mt-1">{data.bookings.length} Booking</span>
            <div className="text-[10px] text-[#8C727D] mt-1.5">
              Antrean pengerjaan studio
            </div>
          </div>

          <div className="bg-white border border-[#FCE2E8] p-5 rounded-2xl shadow-2xs">
            <span className="text-[#8C727D] text-[10px] block uppercase font-bold tracking-wider">Aturan Asosiasi</span>
            <span className="text-2xl font-bold text-[#2D1F24] block mt-1">{data.associationRules.length} Pola</span>
            <div className="text-[10px] text-[#8C727D] mt-1.5">
              Confidence &gt;= {(minConfidence * 100).toFixed(0)}%
            </div>
          </div>
        </div>
      )}

      {/* Notifications */}
      {error && (
        <div className="mb-5 p-4 bg-red-50 border border-red-200 text-red-800 rounded-2xl text-xs flex items-center justify-between">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)} className="text-red-500 font-bold ml-2">×</button>
        </div>
      )}

      {successMsg && (
        <div className="mb-5 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center justify-between">
          <span>✨ {successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-600 font-bold ml-2">×</button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex gap-2 mb-6 border-b border-[#FCE2E8] pb-3">
        <button
          onClick={() => setActiveTab('bookings')}
          className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'bookings'
              ? 'bg-[#FF5376] text-white shadow-xs'
              : 'bg-white border border-[#FCE2E8] text-[#8C727D] hover:bg-[#FFF0F4] hover:text-[#2D1F24]'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Antrean Reservasi ({data?.bookings.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('training')}
          className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'training'
              ? 'bg-[#FF5376] text-white shadow-xs'
              : 'bg-white border border-[#FCE2E8] text-[#8C727D] hover:bg-[#FFF0F4] hover:text-[#2D1F24]'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Latih Model &amp; Data Transaksi</span>
        </button>

        <button
          onClick={() => setActiveTab('itemsets')}
          className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'itemsets'
              ? 'bg-[#FF5376] text-white shadow-xs'
              : 'bg-white border border-[#FCE2E8] text-[#8C727D] hover:bg-[#FFF0F4] hover:text-[#2D1F24]'
          }`}
        >
          <Network className="w-3.5 h-3.5" />
          <span>Hasil Aturan Apriori ({data?.associationRules.length || 0})</span>
        </button>
      </div>

      {/* Tab 1: Bookings Management */}
      {activeTab === 'bookings' && (
        <div className="bg-white border border-[#FCE2E8] rounded-3xl p-6 shadow-xs">
          <h3 className="text-base font-bold text-[#2D1F24] mb-4 pb-2 border-b border-[#FCE2E8] flex items-center justify-between">
            <span>Daftar Pemesanan Treatment</span>
            <span className="text-xs text-[#8C727D]">Pesanan selesai otomatis diinput ke riwayat transaksi</span>
          </h3>

          {!data || data.bookings.length === 0 ? (
            <div className="p-8 text-center bg-[#FFF0F4] rounded-2xl border border-dashed border-[#FCD5DF]">
              <Calendar className="w-8 h-8 text-[#FF5376]/40 mx-auto mb-2" />
              <p className="text-xs font-bold text-[#2D1F24]">Belum ada data reservasi.</p>
              <p className="text-[10px] text-[#8C727D] mt-0.5">Reservasi baru oleh pelanggan akan muncul di sini secara real-time.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#FFF0F4] text-[#8C727D] uppercase text-[9px] tracking-wider font-bold">
                    <th className="p-3 rounded-l-xl">ID / Waktu</th>
                    <th className="p-3">Pelanggan</th>
                    <th className="p-3">Jadwal</th>
                    <th className="p-3">Layanan</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right rounded-r-xl">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#FCE2E8]">
                  {data.bookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-[#FFF0F4]/40 transition-colors">
                      <td className="p-3 font-mono font-bold text-[#2D1F24]">
                        {booking.id}
                        <div className="text-[9px] text-[#8C727D] font-normal">{booking.createdAt}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-[#2D1F24]">{booking.name}</div>
                        <div className="text-[10px] text-[#8C727D]">{booking.phone} • {booking.email}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-[#2D1F24]">{booking.date}</div>
                        <div className="text-[10px] text-[#FF5376] font-semibold">{booking.time} WIB</div>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {booking.services.map((svc, idx) => (
                            <span key={idx} className="px-2 py-0.5 bg-[#FFF0F4] text-[#2D1F24] font-semibold text-[9px] rounded-full">
                              {svc.replace(/_/g, ' ')}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-3">
                        {booking.status === 'pending' && (
                          <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full font-bold text-[9px] uppercase">
                            Menunggu
                          </span>
                        )}
                        {booking.status === 'completed' && (
                          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-bold text-[9px] uppercase">
                            Selesai
                          </span>
                        )}
                        {booking.status === 'cancelled' && (
                          <span className="px-2.5 py-1 bg-gray-100 text-gray-600 border border-gray-200 rounded-full font-bold text-[9px] uppercase">
                            Batal
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        {booking.status === 'pending' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleUpdateStatus(booking.id, 'completed')}
                              className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-full cursor-pointer"
                              title="Tandai Selesai"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(booking.id, 'cancelled')}
                              className="p-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-full cursor-pointer"
                              title="Batalkan"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-[#8C727D] italic">Arsip</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Training Parameters & Dataset Importer */}
      {activeTab === 'training' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Apriori Config Form (6 cols) */}
          <div className="lg:col-span-6 bg-white border border-[#FCE2E8] rounded-3xl p-6 shadow-xs space-y-5">
            <h3 className="text-base font-bold text-[#2D1F24] pb-2 border-b border-[#FCE2E8] flex items-center justify-between">
              <span>Parameter Apriori Algoritma</span>
              <Sliders className="w-4 h-4 text-[#FF5376]" />
            </h3>

            <form onSubmit={handleTrainModel} className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-semibold text-[#2D1F24] mb-1.5">
                  <span>Minimum Support: {(minSupport * 100).toFixed(0)}%</span>
                  <span className="text-[#8C727D] text-[10px]">Nilai (0.01 - 0.5)</span>
                </div>
                <input
                  type="range"
                  min="0.01"
                  max="0.5"
                  step="0.01"
                  value={minSupport}
                  onChange={(e) => setMinSupport(parseFloat(e.target.value))}
                  className="w-full accent-[#FF5376]"
                />
                <p className="text-[10px] text-[#8C727D] mt-1">
                  Ambang batas minimal frekuensi kemunculan kombinasi motif kuku dalam dataset.
                </p>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-[#2D1F24] mb-1.5">
                  <span>Minimum Confidence: {(minConfidence * 100).toFixed(0)}%</span>
                  <span className="text-[#8C727D] text-[10px]">Nilai (0.1 - 1.0)</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={minConfidence}
                  onChange={(e) => setMinConfidence(parseFloat(e.target.value))}
                  className="w-full accent-[#FF5376]"
                />
                <p className="text-[10px] text-[#8C727D] mt-1">
                  Tingkat kepastian hubungan sebab-akibat antar motif kuku (Jika pesan X, maka pesan Y).
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-[#FF5376] hover:bg-[#FF3E66] text-white text-xs font-bold uppercase tracking-wider rounded-full transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Latih Model Apriori Sekarang</span>
              </button>
            </form>

            <div className="p-3.5 bg-[#FFF0F4] rounded-2xl text-[10px] text-[#8C727D] leading-relaxed border border-[#FCD5DF]">
              💡 <strong>Otomatisasi Latihan (20 Transaksi):</strong> Setiap 20 transaksi baru terekam di studio, sistem secara otomatis mengeksekusi iterasi Apriori untuk meregenerasi association rules tanpa intervensi manual.
            </div>
          </div>

          {/* CSV File Drag & Drop + Manual Transaction Entry (6 cols) */}
          <div className="lg:col-span-6 space-y-6">
            {/* CSV Importer */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`bg-white border-2 border-dashed rounded-3xl p-6 text-center transition-all ${
                isDragging ? 'border-[#FF5376] bg-[#FFF0F4]' : 'border-[#FCD5DF]'
              }`}
            >
              <Upload className="w-8 h-8 text-[#FF5376] mx-auto mb-2" />
              <h4 className="text-xs font-bold text-[#2D1F24]">Impor Dataset CSV Transaksi</h4>
              <p className="text-[10px] text-[#8C727D] mt-1 mb-3">
                Tarik file CSV ke sini atau klik tombol di bawah (Format: satu baris per transaksi dengan item dipisah koma).
              </p>

              <label className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#FFF0F4] hover:bg-[#FFE4EC] text-[#FF5376] border border-[#FCD5DF] rounded-full text-xs font-bold cursor-pointer transition-all">
                <Upload className="w-3.5 h-3.5" />
                <span>Pilih File CSV</span>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Manual Transaction Input */}
            <div className="bg-white border border-[#FCE2E8] rounded-3xl p-5 shadow-xs">
              <h4 className="text-xs font-bold text-[#2D1F24] mb-2 flex items-center justify-between">
                <span>Input Transaksi Kasir Manual</span>
                <span className="text-[10px] text-[#8C727D]">{manualTransaction.length} item dipilih</span>
              </h4>

              <div className="flex flex-wrap gap-1.5 mb-3 max-h-32 overflow-y-auto pr-1">
                {designs.map((design) => {
                  const isChecked = manualTransaction.includes(design.id);
                  return (
                    <button
                      key={design.id}
                      type="button"
                      onClick={() => toggleManualItemSelection(design.id)}
                      className={`px-2.5 py-1 text-[10px] rounded-full font-semibold transition-all cursor-pointer ${
                        isChecked
                          ? 'bg-[#FF5376] text-white shadow-2xs'
                          : 'bg-[#FFF0F4] text-[#8C727D] hover:bg-[#FFE4EC] border border-[#FCE2E8]'
                      }`}
                    >
                      {design.name}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={handleManualTransactionAdd}
                className="w-full py-2 bg-white hover:bg-[#FFF0F4] text-[#FF5376] border border-[#FF5376] text-xs font-bold rounded-full transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Simpan Transaksi Kasir</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Frequent Itemsets & Rules Visualization */}
      {activeTab === 'itemsets' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Frequent Itemsets */}
          <div className="lg:col-span-6 bg-white border border-[#FCE2E8] rounded-3xl p-6 shadow-xs">
            <h3 className="text-base font-bold text-[#2D1F24] mb-4 pb-2 border-b border-[#FCE2E8] flex items-center justify-between">
              <span>Frequent Itemsets (Dukungan &gt;= {(minSupport * 100).toFixed(0)}%)</span>
              <span className="text-xs text-[#FF5376] font-bold">{data?.frequentItemsets.length || 0} Sets</span>
            </h3>

            {!data || data.frequentItemsets.length === 0 ? (
              <p className="text-xs text-[#8C727D] text-center py-6">Tidak ada itemset yang memenuhi nilai min. support.</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {data.frequentItemsets.map((itemset, i) => (
                  <div
                    key={i}
                    className="p-3 bg-[#FFF0F4] rounded-2xl border border-[#FCE2E8] flex items-center justify-between text-xs"
                  >
                    <div className="flex flex-wrap items-center gap-1">
                      {itemset.items.map((it, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-white text-[#2D1F24] font-bold text-[10px] rounded-full border border-[#FCD5DF]">
                          {it}
                        </span>
                      ))}
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-[#FF5376] font-bold block">{itemset.support}%</span>
                      <span className="text-[8px] text-[#8C727D] block">{itemset.count} Transaksi</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Association Rules */}
          <div className="lg:col-span-6 bg-white border border-[#FCE2E8] rounded-3xl p-6 shadow-xs">
            <h3 className="text-base font-bold text-[#2D1F24] mb-4 pb-2 border-b border-[#FCE2E8] flex items-center justify-between">
              <span>Aturan Asosiasi (Confidence &gt;= {(minConfidence * 100).toFixed(0)}%)</span>
              <span className="text-xs text-[#FF5376] font-bold">{data?.associationRules.length || 0} Rules</span>
            </h3>

            {!data || data.associationRules.length === 0 ? (
              <p className="text-xs text-[#8C727D] text-center py-6">Tidak ada aturan yang memenuhi batas min. confidence.</p>
            ) : (
              <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                {data.associationRules.map((rule, i) => (
                  <div
                    key={i}
                    className="p-3.5 bg-white rounded-2xl border border-[#FCE2E8] hover:border-[#FF5376] transition-all text-xs"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5 font-bold text-[11px]">
                        <span className="text-[#2D1F24] px-2 py-0.5 bg-[#FFF0F4] rounded-full">{rule.antecedent}</span>
                        <span className="text-[#FF5376]">&rarr;</span>
                        <span className="text-[#2D1F24] px-2 py-0.5 bg-[#FFF0F4] rounded-full">{rule.consequent}</span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-[#FF5376] font-bold block">{rule.confidence}%</span>
                        <span className="text-[8px] text-[#8C727D] block">Lift: {rule.lift}x</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-[#8C727D]">
                      Pelanggan yang memesan {rule.antecedent} memiliki kecenderungan {rule.confidence}% untuk turut memilih {rule.consequent}.
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
