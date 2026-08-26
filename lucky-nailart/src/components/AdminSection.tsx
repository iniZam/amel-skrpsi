import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Upload, Database, RefreshCw, Calendar, Check, X,
  Trash2, ShieldCheck, Play, Sliders, List, Network, Plus
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
    <div className="py-12 px-4 max-w-7xl mx-auto text-left animate-fade-in" id="admin-panel">
      {/* Admin Title Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pb-6 border-b border-art-border">
        <div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-art-gold bg-art-light border border-art-border rounded-none px-3 py-1 uppercase tracking-widest mb-2 w-fit">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>KONSOL ADMINISTRATOR SECURE</span>
          </div>
          <h2 className="text-3xl font-serif text-art-text uppercase tracking-tight">Dashboard Pengelola Studio</h2>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboardData}
            className="p-2.5 bg-white border border-art-border text-art-text rounded-none hover:bg-art-light transition-all cursor-pointer"
            title="Muat Ulang Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onLogout}
            className="py-2.5 px-4 bg-transparent text-red-700 border border-red-200 text-[10px] font-bold uppercase tracking-widest rounded-none hover:bg-red-50 transition-all cursor-pointer"
          >
            Keluar (Logout)
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {data && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white border border-art-border p-5 rounded-none">
            <span className="text-art-stone text-[9px] font-mono block uppercase tracking-wider">Total Transaksi (Dataset)</span>
            <span className="text-2xl font-serif text-art-text block mt-1">{data.totalTransactions} Tx</span>
            <div className="text-[10px] text-art-stone mt-2 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-emerald-500 inline-block"></span>
              SQLite Database Aktif
            </div>
          </div>

          <div className="bg-white border border-art-border p-5 rounded-none">
            <span className="text-art-stone text-[9px] font-mono block uppercase tracking-wider">Transaksi Baru Sejak Latihan</span>
            <span className="text-2xl font-serif text-art-gold block mt-1">
              {data.newTransactionsSinceLastTrain} <span className="text-xs text-art-stone">/ 20</span>
            </span>
            <div className="text-[10px] text-art-gold mt-2 font-mono">
              🔄 Retraining otomatis di 20 Tx
            </div>
          </div>

          <div className="bg-white border border-art-border p-5 rounded-none">
            <span className="text-art-stone text-[9px] font-mono block uppercase tracking-wider">Total Reservasi (Booking)</span>
            <span className="text-2xl font-serif text-art-text block mt-1">{data.bookings.length} Reservasi</span>
            <div className="text-[10px] text-art-stone mt-2">
              Dalam antrean pengerjaan studio
            </div>
          </div>

          <div className="bg-white border border-art-border p-5 rounded-none">
            <span className="text-art-stone text-[9px] font-mono block uppercase tracking-wider">Aturan Asosiasi (Apriori Rules)</span>
            <span className="text-2xl font-serif text-art-text block mt-1">{data.associationRules.length} Pola</span>
            <div className="text-[10px] text-art-gold mt-2 font-mono font-bold">
              Min. Sup: {minSupport} | Conf: {minConfidence}
            </div>
          </div>
        </div>
      )}

      {/* Notifications Alert */}
      {successMsg && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200/50 text-emerald-800 rounded-none text-xs flex items-start gap-2.5">
          <span className="shrink-0">✅</span>
          <p>{successMsg}</p>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200/50 text-red-800 rounded-none text-xs">
          <span>⚠️ {error}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-art-border mb-8 overflow-x-auto gap-2">
        <button
          onClick={() => setActiveTab('bookings')}
          className={`py-3 px-4 font-serif text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === 'bookings'
              ? 'border-art-gold text-art-text'
              : 'border-transparent text-art-stone hover:text-art-text'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Daftar Reservasi &amp; Booking
        </button>
        <button
          onClick={() => setActiveTab('training')}
          className={`py-3 px-4 font-serif text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === 'training'
              ? 'border-art-gold text-art-text'
              : 'border-transparent text-art-stone hover:text-art-text'
          }`}
        >
          <Database className="w-4 h-4" />
          Latih &amp; Upload Data (Apriori)
        </button>
        <button
          onClick={() => setActiveTab('itemsets')}
          className={`py-3 px-4 font-serif text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === 'itemsets'
              ? 'border-art-gold text-art-text'
              : 'border-transparent text-art-stone hover:text-art-text'
          }`}
        >
          <Network className="w-4 h-4" />
          Pola Asosiasi &amp; Itemset Terlatih
        </button>
      </div>

      {/* Content Panels */}
      {activeTab === 'bookings' && (
        <div className="bg-white border border-art-border rounded-none p-6">
          <h3 className="text-lg font-serif font-bold text-art-text uppercase tracking-tight mb-4">Pengelolaan Reservasi Pelanggan</h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-art-light border-b border-art-border text-art-stone font-bold uppercase tracking-wider">
                  <th className="p-3.5">No. Reservasi</th>
                  <th className="p-3.5">Pelanggan</th>
                  <th className="p-3.5">Kontak</th>
                  <th className="p-3.5">Desain Dipilih</th>
                  <th className="p-3.5">Waktu Kunjungan</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-art-border text-art-text">
                {data && data.bookings.length > 0 ? (
                  data.bookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-art-light transition-colors">
                      <td className="p-3.5 font-mono font-bold text-art-text">{booking.id}</td>
                      <td className="p-3.5 font-semibold">{booking.name}</td>
                      <td className="p-3.5">
                        <span className="block font-medium">{booking.email}</span>
                        <span className="block text-art-stone text-[10px] font-mono">{booking.phone}</span>
                      </td>
                      <td className="p-3.5">
                        <div className="flex flex-wrap gap-1">
                          {booking.services.map((svc, i) => (
                            <span key={i} className="px-2 py-0.5 bg-white text-[10px] text-art-text font-bold uppercase tracking-wider border border-art-border">
                              {svc.replace(/_/g, ' ')}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className="block font-semibold">{booking.date}</span>
                        <span className="block text-[10px] text-art-gold font-bold font-mono uppercase tracking-wider">{booking.time} WIB</span>
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-0.5 rounded-none text-[9px] font-bold uppercase border ${
                          booking.status === 'pending'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : booking.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-stone-50 text-stone-400 border-stone-200'
                        }`}>
                          {booking.status === 'pending' ? 'Menunggu' : booking.status === 'completed' ? 'Selesai' : 'Batal'}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        {booking.status === 'pending' ? (
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => handleUpdateStatus(booking.id, 'completed')}
                              className="p-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-none transition-all flex items-center gap-1 cursor-pointer text-[9px] uppercase tracking-wider"
                              title="Selesaikan & Rekam Transaksi"
                            >
                              <Check className="w-3.5 h-3.5" /> Selesai
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(booking.id, 'cancelled')}
                              className="p-1.5 px-3 bg-art-light border border-art-border text-art-text font-bold rounded-none hover:bg-white transition-all flex items-center gap-1 cursor-pointer text-[9px] uppercase tracking-wider"
                              title="Batalkan Booking"
                            >
                              <X className="w-3.5 h-3.5" /> Batal
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-art-stone italic font-medium">Selesai</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-art-stone font-mono tracking-wider uppercase">
                      Tidak ada daftar reservasi saat ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'training' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* CSV File Upload (8 Columns) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Drag & Drop Card */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`bg-white border border-dashed p-8 lg:p-12 text-center transition-all duration-300 rounded-none ${
                isDragging
                  ? 'border-art-gold bg-art-light'
                  : 'border-art-border hover:border-art-stone'
              }`}
            >
              <div className="w-16 h-16 bg-art-light rounded-full flex items-center justify-center text-art-gold mx-auto mb-4 border border-art-border">
                <Upload className="w-8 h-8 stroke-1" />
              </div>
              <h4 className="font-serif text-lg text-art-text font-bold uppercase tracking-tight mb-2">Impor Transaksi Baru via CSV</h4>
              <p className="text-art-muted text-xs max-w-md mx-auto leading-relaxed mb-6">
                Seret file CSV Anda ke sini atau klik tombol pilih file. Sistem akan membaca daftar transaksi, memperbarui database, dan menjalankan Apriori secara instan.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <label className="py-3 px-6 bg-art-dark hover:bg-art-gold text-white text-[10px] font-bold tracking-widest uppercase rounded-none transition-all cursor-pointer">
                  Pilih File CSV
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* CSV Format Guideline */}
              <div className="mt-8 pt-6 border-t border-art-border text-left max-w-md mx-auto">
                <span className="text-[10px] font-mono font-bold tracking-widest text-art-gold bg-art-light px-2.5 py-1 border border-art-border">PENTING: FORMAT CSV</span>
                <p className="text-[10px] text-art-muted leading-relaxed mt-2">
                  Gunakan format file teks murni dengan ekstensi <code>.csv</code>. Setiap baris merupakan satu transaksi belanja kuku pelanggan, pisahkan item dengan tanda koma:
                </p>
                <pre className="mt-2 p-3 bg-art-light text-[9px] font-mono text-art-text border border-art-border rounded-none">
                  French_Tips,Nude_Gel,Gold_Foil<br />
                  Chrome_Finish,Cat_Eye<br />
                  Nude_Gel,Marble_Art
                </pre>
              </div>
            </div>

            {/* Manual Transaction Simulator */}
            <div className="bg-white border border-art-border rounded-none p-6">
              <h4 className="font-serif text-base text-art-text font-bold uppercase tracking-wide mb-1 flex items-center gap-2">
                <Plus className="w-4 h-4 text-art-gold" />
                Simulasi Kasir Fisik (Tambah Transaksi Manual)
              </h4>
              <p className="text-art-muted text-xs mb-4">
                Pilih kuku yang dibeli oleh pelanggan di studio untuk mencatat transaksi baru secara manual ke database.
              </p>

              <div className="flex flex-wrap gap-2 mb-6">
                {designs.map(design => {
                  const isSelected = manualTransaction.includes(design.id);
                  return (
                    <button
                      key={design.id}
                      onClick={() => toggleManualItemSelection(design.id)}
                      className={`px-3 py-2 text-[10px] font-bold uppercase tracking-wider rounded-none border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-art-gold border-art-gold text-white'
                          : 'bg-white border-art-border text-art-text hover:border-art-stone'
                      }`}
                    >
                      {design.name}
                    </button>
                  );
                })}
              </div>

              <div className="flex justify-between items-center bg-art-light border border-art-border p-4 rounded-none">
                <div className="text-xs uppercase font-semibold text-art-text">
                  <span className="text-art-stone font-medium">Item Terpilih: </span>
                  <span className="font-bold">{manualTransaction.length} item kuku</span>
                </div>
                <button
                  onClick={handleManualTransactionAdd}
                  className="py-2.5 px-4 bg-art-dark hover:bg-art-gold text-white text-[10px] font-bold uppercase tracking-widest rounded-none transition-all cursor-pointer"
                >
                  Tambahkan Transaksi
                </button>
              </div>
            </div>
          </div>

          {/* Training Hyperparameters (4 Columns) */}
          <div className="lg:col-span-4 bg-white border border-art-border rounded-none p-6 h-fit space-y-6">
            <h4 className="font-serif text-base text-art-text font-bold uppercase tracking-wide pb-3 border-b border-art-border flex items-center gap-2">
              <Sliders className="w-4.5 h-4.5 text-art-gold" />
              Parameter Model
            </h4>

            <form onSubmit={handleTrainModel} className="space-y-6">
              {/* Min Support Slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold uppercase text-art-text">
                  <span>Minimum Support</span>
                  <span className="font-mono text-art-gold">{minSupport}</span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="0.5"
                  step="0.01"
                  value={minSupport}
                  onChange={(e) => setMinSupport(parseFloat(e.target.value))}
                  className="w-full accent-art-gold"
                />
                <p className="text-[10px] text-art-stone leading-relaxed">
                  Batas minimal sebaran itemset dalam total transaksi. Semakin rendah, semakin banyak pola unik yang didapat.
                </p>
              </div>

              {/* Min Confidence Slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold uppercase text-art-text">
                  <span>Minimum Confidence</span>
                  <span className="font-mono text-art-gold">{minConfidence}</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="0.9"
                  step="0.05"
                  value={minConfidence}
                  onChange={(e) => setMinConfidence(parseFloat(e.target.value))}
                  className="w-full accent-art-gold"
                />
                <p className="text-[10px] text-art-stone leading-relaxed">
                  Tingkat kepastian hubungan sebab-akibat (Confidence). Nilai 0.3 berarti minimal 30% keakuratan relasi.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-art-dark hover:bg-art-gold text-white text-[10px] font-bold uppercase tracking-widest rounded-none transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Latih Model Sekarang
              </button>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'itemsets' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Itemsets Table */}
          <div className="bg-white border border-art-border rounded-none p-6">
            <h4 className="font-serif text-base text-art-text font-bold uppercase tracking-wide mb-4 pb-2 border-b border-art-border flex items-center gap-2">
              <List className="w-4 h-4 text-art-gold" />
              Itemset Populer Terlatih (Frequent Itemsets)
            </h4>

            <div className="overflow-y-auto max-h-[500px]">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-art-light border-b border-art-border text-art-stone font-bold uppercase tracking-wider">
                    <th className="p-2.5">Kombinasi Desain (Itemset)</th>
                    <th className="p-2.5 text-center">Size (k)</th>
                    <th className="p-2.5 text-right">Support (%)</th>
                    <th className="p-2.5 text-right">Frekuensi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-art-border text-art-text">
                  {data && data.frequentItemsets.length > 0 ? (
                    data.frequentItemsets.map((itemset, idx) => (
                      <tr key={idx} className="hover:bg-art-light transition-colors">
                        <td className="p-2.5 font-medium flex flex-wrap gap-1">
                          {itemset.items.map((it, i) => (
                            <span key={i} className="px-1.5 py-0.5 bg-white border border-art-border text-[9px] font-bold text-art-text uppercase tracking-wider">
                              {it.replace(/_/g, ' ')}
                            </span>
                          ))}
                        </td>
                        <td className="p-2.5 text-center font-mono text-art-stone">{itemset.k}</td>
                        <td className="p-2.5 text-right font-bold text-art-text">{(itemset.support * 100).toFixed(1)}%</td>
                        <td className="p-2.5 text-right text-art-stone font-mono">{itemset.count} kali</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-art-stone font-medium italic">
                        Belum ada itemset populer terlatih.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Association Rules Table */}
          <div className="bg-white border border-art-border rounded-none p-6">
            <h4 className="font-serif text-base text-art-text font-bold uppercase tracking-wide mb-4 pb-2 border-b border-art-border flex items-center gap-2">
              <Network className="w-4 h-4 text-art-gold" />
              Aturan Asosiasi Terlatih (Association Rules)
            </h4>

            <div className="overflow-y-auto max-h-[500px]">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-art-light border-b border-art-border text-art-stone font-bold uppercase tracking-wider">
                    <th className="p-2.5">Aturan Relasi (Jika &rarr; Maka)</th>
                    <th className="p-2.5 text-right">Support</th>
                    <th className="p-2.5 text-right">Confidence</th>
                    <th className="p-2.5 text-right">Lift Ratio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-art-border text-art-text">
                  {data && data.associationRules.length > 0 ? (
                    data.associationRules.map((rule, idx) => (
                      <tr key={idx} className="hover:bg-art-light transition-colors">
                        <td className="p-2.5 text-xs">
                          <div className="flex flex-wrap items-center gap-1">
                            <span className="font-bold text-art-text bg-art-light border border-art-border px-1.5 py-0.5 rounded-none uppercase tracking-wider">
                              {rule.antecedent.map(it => it.replace(/_/g, ' ')).join(', ')}
                            </span>
                            <span className="text-art-gold font-bold">&rarr;</span>
                            <span className="font-bold text-art-text bg-white border border-art-border px-1.5 py-0.5 rounded-none uppercase tracking-wider">
                              {rule.consequent.map(it => it.replace(/_/g, ' ')).join(', ')}
                            </span>
                          </div>
                        </td>
                        <td className="p-2.5 text-right text-art-stone font-mono">{(rule.support * 100).toFixed(1)}%</td>
                        <td className="p-2.5 text-right font-bold text-art-gold">{(rule.confidence * 100).toFixed(1)}%</td>
                        <td className="p-2.5 text-right">
                          <span className={`px-1.5 py-0.5 rounded-none text-[10px] font-bold ${
                            rule.lift > 1.2 ? 'bg-emerald-50 text-emerald-700' : 'bg-stone-100 text-stone-600'
                          }`}>
                            {rule.lift.toFixed(2)}x
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-art-stone font-medium italic">
                        Belum ada aturan asosiasi terlatih.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
