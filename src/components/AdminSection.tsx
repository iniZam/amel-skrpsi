import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Upload, Database, RefreshCw, Calendar, Check, X,
  Trash2, ShieldCheck, Play, Sliders, List, Network, Plus, Sparkles,
  Image as ImageIcon, Edit3, Search, RotateCcw, Camera,
  UploadCloud, FileImage, CheckCircle2, AlertCircle, Link as LinkIcon
} from 'lucide-react';
import { AdminDashboardData, Booking, NailDesign } from '../types';

interface AdminSectionProps {
  designs: NailDesign[];
  onLogout: () => void;
  onDesignsUpdated?: () => void;
}

const PRESET_GALLERY_IMAGES = [
  {
    name: "Daisy Nude & Floral",
    url: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=600&auto=format&fit=crop",
    category: "Cute"
  },
  {
    name: "Milky White Minimalist",
    url: "https://images.unsplash.com/photo-1607779097040-26e80aa78e66?q=80&w=600&auto=format&fit=crop",
    category: "Minimalis"
  },
  {
    name: "Sugar Berry Ombre",
    url: "https://images.unsplash.com/photo-1632345031435-8797b2d58045?q=80&w=600&auto=format&fit=crop",
    category: "Korea Style"
  },
  {
    name: "Mocha Love Checkered",
    url: "https://images.unsplash.com/photo-1519014816548-bf5fe059798b?q=80&w=600&auto=format&fit=crop",
    category: "Korea Style"
  },
  {
    name: "French Tips Classic",
    url: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=600&auto=format&fit=crop",
    category: "Classic"
  },
  {
    name: "Glitter Glam Crimson",
    url: "https://images.unsplash.com/photo-1604654894610-df63bc536371?q=80&w=600&auto=format&fit=crop",
    category: "Glitter"
  },
  {
    name: "Cat Eye Velvet Rose",
    url: "https://images.unsplash.com/photo-1522337094133-f30f51db0d5b?q=80&w=600&auto=format&fit=crop",
    category: "Elegant"
  },
  {
    name: "Pastel Lilac Sky",
    url: "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=600&auto=format&fit=crop",
    category: "Cute"
  }
];

const CATEGORY_OPTIONS = [
  'Minimalis',
  'Elegant',
  'Cute',
  'Korea Style',
  'Colorful',
  'Glitter',
  'Classic'
];

const TAG_OPTIONS = [
  'Populer',
  'Best Seller',
  'Rekomendasi',
  'Premium',
  'Baru',
  'Favorit',
  'Tren 2026'
];

export default function AdminSection({ designs, onLogout, onDesignsUpdated }: AdminSectionProps) {
  const [activeTab, setActiveTab] = useState<'bookings' | 'gallery' | 'training' | 'itemsets'>('itemsets');
  const [itemsetFilter, setItemsetFilter] = useState<'all' | 'bundles' | 'single'>('all');
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Format helpers for Apriori metrics (support/confidence stored as 0..1 or 0..100)
  const formatPct = (val: number) => {
    const pct = val <= 1 ? val * 100 : val;
    return (Math.round(pct * 10) / 10).toString();
  };

  const formatLift = (val: number) => {
    return (Math.round((val || 1) * 100) / 100).toFixed(2);
  };

  const formatRuleSide = (side: string[] | string) => {
    return Array.isArray(side) ? side.join(', ') : String(side);
  };

  // Training parameters state
  const [minSupport, setMinSupport] = useState(0.1);
  const [minConfidence, setMinConfidence] = useState(0.3);

  // Manual transaction builder state
  const [manualTransaction, setManualTransaction] = useState<string[]>([]);

  // CSV Drag and Drop State
  const [isDragging, setIsDragging] = useState(false);

  // Gallery / Services state
  const [localDesigns, setLocalDesigns] = useState<NailDesign[]>(designs);
  const [galleryFilter, setGalleryFilter] = useState<string>('Semua');
  const [gallerySearch, setGallerySearch] = useState<string>('');
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [showPresetPicker, setShowPresetPicker] = useState(false);

  // Photo upload & processing state
  const [photoSourceMode, setPhotoSourceMode] = useState<'upload' | 'preset' | 'url'>('upload');
  const [isPhotoDragging, setIsPhotoDragging] = useState(false);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [photoFileInfo, setPhotoFileInfo] = useState<{ name: string; origSize: string; compSize: string } | null>(null);
  const [photoUploadError, setPhotoUploadError] = useState<string | null>(null);
  const photoFileInputRef = useRef<HTMLInputElement>(null);

  // Format bytes helper
  const formatBytes = (bytes: number, decimals = 1) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  // Helper to read and compress photo using HTML5 Canvas
  const processImageFile = async (file: File): Promise<string> => {
    if (!file.type.startsWith('image/')) {
      throw new Error('File yang dipilih bukan gambar (harus PNG, JPG, JPEG, atau WEBP).');
    }
    if (file.size > 20 * 1024 * 1024) {
      throw new Error('Ukuran foto terlalu besar (maksimal 20MB).');
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Gagal membaca file foto dari perangkat.'));
      reader.onload = (event) => {
        const img = new Image();
        img.onerror = () => reject(new Error('Format gambar tidak dapat dibaca oleh browser.'));
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 1200;
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(event.target?.result as string);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.88);

          const head = 'data:image/jpeg;base64,';
          const sizeInBytes = Math.round((dataUrl.length - head.length) * 3 / 4);

          setPhotoFileInfo({
            name: file.name,
            origSize: formatBytes(file.size),
            compSize: formatBytes(sizeInBytes)
          });

          resolve(dataUrl);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handlePhotoFileSelected = async (file: File) => {
    setPhotoUploadError(null);
    setIsProcessingPhoto(true);
    try {
      const dataUrl = await processImageFile(file);
      setFormData(prev => ({ ...prev, image: dataUrl }));
      setSuccessMsg(`Foto "${file.name}" berhasil diunggah! ✨`);
    } catch (err: any) {
      setPhotoUploadError(err.message || 'Gagal memproses foto.');
    } finally {
      setIsProcessingPhoto(false);
    }
  };

  const handlePhotoDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsPhotoDragging(true);
  };

  const handlePhotoDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsPhotoDragging(false);
  };

  const handlePhotoDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsPhotoDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handlePhotoFileSelected(file);
    }
  };

  // Form state for Add/Edit service
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    price: 120000,
    category: 'Minimalis',
    tag: 'Populer',
    rating: 4.8,
    styleSubtitle: 'Trendy & Cantik',
    image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=600&auto=format&fit=crop',
    description: ''
  });

  // Fetch admin dashboard details
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [dashRes, galRes] = await Promise.all([
        fetch('/api/admin/dashboard'),
        fetch('/api/admin/services')
      ]);

      if (!dashRes.ok) throw new Error("Gagal mengambil data dashboard.");
      const result: AdminDashboardData = await dashRes.json();
      setData(result);
      setMinSupport(result.config.minSupport);
      setMinConfidence(result.config.minConfidence);

      if (galRes.ok) {
        const galResult = await galRes.json();
        setLocalDesigns(galResult);
      }
    } catch (err: any) {
      setError(err.message || "Gagal menghubungi server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (designs && designs.length > 0) {
      setLocalDesigns(designs);
    }
  }, [designs]);

  // Gallery CRUD Operations
  const handleOpenAddModal = () => {
    setEditingServiceId(null);
    setPhotoSourceMode('upload');
    setPhotoFileInfo(null);
    setPhotoUploadError(null);
    setShowPresetPicker(false);
    setFormData({
      id: '',
      name: '',
      price: 120000,
      category: 'Minimalis',
      tag: 'Populer',
      rating: 4.8,
      styleSubtitle: 'Natural & Manis',
      image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=600&auto=format&fit=crop',
      description: 'Perawatan kuku estetik dengan polesan gel berkualitas tinggi dan sentuhan motif menawan.'
    });
    setIsServiceModalOpen(true);
  };

  const handleOpenEditModal = (service: NailDesign) => {
    setEditingServiceId(service.id);
    setPhotoSourceMode('upload');
    setPhotoFileInfo(null);
    setPhotoUploadError(null);
    setShowPresetPicker(false);
    setFormData({
      id: service.id,
      name: service.name,
      price: service.price,
      category: service.category || 'Minimalis',
      tag: service.tag || 'Populer',
      rating: service.rating || 4.8,
      styleSubtitle: service.styleSubtitle || '',
      image: service.image,
      description: service.description || ''
    });
    setIsServiceModalOpen(true);
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError("Nama layanan/motif kuku tidak boleh kosong.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (editingServiceId) {
        const response = await fetch(`/api/admin/services/${editingServiceId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Gagal memperbarui layanan.");

        setLocalDesigns(result.designs);
        setSuccessMsg(`Layanan "${formData.name}" berhasil diperbarui! ✨`);
      } else {
        const response = await fetch('/api/admin/services', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Gagal menambahkan layanan.");

        setLocalDesigns(result.designs);
        setSuccessMsg(`Layanan "${formData.name}" berhasil ditambahkan ke galeri! 🌸`);
      }

      setIsServiceModalOpen(false);
      if (onDesignsUpdated) onDesignsUpdated();
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat menyimpan layanan.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteService = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus motif "${name}" dari galeri?`)) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/services/${id}`, {
        method: 'DELETE'
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Gagal menghapus layanan.");

      setLocalDesigns(result.designs);
      setSuccessMsg(`Layanan "${name}" berhasil dihapus dari galeri.`);
      if (onDesignsUpdated) onDesignsUpdated();
    } catch (err: any) {
      setError(err.message || "Gagal menghapus layanan.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetGalleryToDefault = async () => {
    if (!confirm("Kembalikan seluruh daftar galeri dan foto layanan ke setelan awal (10 motif standar)?")) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/services/reset', {
        method: 'POST'
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Gagal mereset galeri.");

      setLocalDesigns(result.designs);
      setSuccessMsg("Galeri kuku berhasil di-reset ke katalog standar! 🌸");
      if (onDesignsUpdated) onDesignsUpdated();
    } catch (err: any) {
      setError(err.message || "Gagal mereset katalog.");
    } finally {
      setLoading(false);
    }
  };

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

  const handleResetToUserDataset = async () => {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const response = await fetch('/api/admin/reset-dataset', {
        method: 'POST'
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Gagal menerapkan dataset referensi.");

      setSuccessMsg(`Dataset referensi awal (31 transaksi riil nail art) berhasil diterapkan! Menghasilkan ${result.frequentSetsCount} Itemset dan ${result.rulesCount} Aturan Asosiasi.`);
      setMinSupport(0.15);
      setMinConfidence(0.5);
      fetchDashboardData();
    } catch (err: any) {
      setError(err.message || "Gagal menerapkan dataset referensi.");
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

  // Filtered designs for admin gallery management
  const filteredAdminDesigns = localDesigns.filter(item => {
    const matchesCategory = galleryFilter === 'Semua' || item.category === galleryFilter;
    const matchesSearch = !gallerySearch ||
      item.name.toLowerCase().includes(gallerySearch.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(gallerySearch.toLowerCase())) ||
      item.id.toLowerCase().includes(gallerySearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="py-10 px-4 max-w-7xl mx-auto text-left" id="admin-panel">
      {/* Admin Title Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-5 border-b border-[#FCE2E8]">
        <div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#FF5376] bg-[#FFF0F4] border border-[#FCD5DF] rounded-full px-3 py-1 uppercase tracking-wider mb-1.5 w-fit">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>KONSOL ADMINISTRATOR NAILOVE</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-sans font-extrabold text-[#2D1F24] tracking-tight">
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
              Dataset Riwayat Aktif
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
            <span className="text-[#8C727D] text-[10px] block uppercase font-bold tracking-wider">Total Galeri / Layanan</span>
            <span className="text-2xl font-bold text-[#2D1F24] block mt-1">{localDesigns.length} Motif</span>
            <div className="text-[10px] text-[#8C727D] mt-1.5">
              Katalog aktif di antarmuka
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#FF5376] to-[#E84366] text-white p-5 rounded-2xl shadow-md shadow-pink-200">
            <span className="text-pink-100 text-[10px] block uppercase font-bold tracking-wider">Aturan Asosiasi Apriori</span>
            <span className="text-2xl font-extrabold text-white block mt-1">{data.associationRules.length} Pola Aktif</span>
            <div className="text-[10px] text-pink-100 mt-1.5 font-semibold">
              Min. Support {(minSupport * 100).toFixed(0)}% &bull; Conf &gt;= {(minConfidence * 100).toFixed(0)}%
            </div>
          </div>
        </div>
      )}

      {/* Prominent Apriori Recommendation Spotlight on Admin Dashboard */}
      {data && data.associationRules.length > 0 && (
        <div className="mb-6 rounded-3xl bg-gradient-to-r from-[#2D1F24] via-[#3D2530] to-[#4E2838] text-white p-6 shadow-lg border border-[#FF5376]/30 relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 mb-4 border-b border-white/10">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#FF5376] text-white text-[10px] font-extrabold uppercase tracking-wider mb-1.5">
                <Sparkles className="w-3 h-3" />
                <span>SOROTAN UTAMA REKOMENDASI APRIORI</span>
              </div>
              <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                Top Rekomendasi Pasangan Motif Kuku (Market Basket Analysis)
              </h3>
              <p className="text-xs text-pink-100/80 mt-0.5">
                Hasil ekstraksi aturan asosiasi terkuat dari {data.totalTransactions} transaksi untuk rekomendasi otomatis ke pelanggan.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('itemsets')}
                className="px-4 py-2 rounded-full bg-white text-[#2D1F24] hover:bg-[#FFF0F4] text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <Network className="w-3.5 h-3.5 text-[#FF5376]" />
                <span>Lihat Semua Aturan ({data.associationRules.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('training')}
                className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Sliders className="w-3.5 h-3.5 text-[#FF8DA6]" />
                <span>Atur Parameter</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {[...data.associationRules]
              .sort((a, b) => b.confidence - a.confidence || b.lift - a.lift)
              .slice(0, 3)
              .map((rule, idx) => {
                const confPct = formatPct(rule.confidence);
                const supPct = formatPct(rule.support);
                const liftStr = formatLift(rule.lift);
                const antStr = formatRuleSide(rule.antecedent);
                const consStr = formatRuleSide(rule.consequent);

                return (
                  <div
                    key={idx}
                    className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <span className="px-2.5 py-0.5 rounded-full bg-[#FF5376] text-white text-[10px] font-extrabold">
                          #Top {idx + 1} Rule
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 border border-emerald-300/30 text-[10px] font-bold">
                          Lift {liftStr}x &bull; Support {supPct}%
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 my-2">
                        <span className="px-2.5 py-1 rounded-xl bg-white/15 text-white font-bold text-xs capitalize">
                          Jika: {antStr}
                        </span>
                        <span className="text-[#FF8DA6] font-extrabold text-sm">&rarr;</span>
                        <span className="px-2.5 py-1 rounded-xl bg-[#FFF0F4] text-[#FF5376] font-extrabold text-xs capitalize">
                          Maka: {consStr}
                        </span>
                      </div>
                    </div>

                    <div className="mt-2 pt-2 border-t border-white/10">
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-pink-200/90">Confidence (Tingkat Keyakinan):</span>
                        <span className="font-extrabold text-white">{confPct}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-white/15 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#FF5376] to-amber-300 rounded-full"
                          style={{ width: `${Math.min(100, Number(confPct))}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
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
      <div className="flex flex-wrap gap-2 mb-6 border-b border-[#FCE2E8] pb-3">
        <button
          onClick={() => setActiveTab('itemsets')}
          className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'itemsets'
              ? 'bg-[#FF5376] text-white shadow-sm shadow-pink-200'
              : 'bg-white border border-[#FCE2E8] text-[#8C727D] hover:bg-[#FFF0F4] hover:text-[#2D1F24]'
          }`}
        >
          <Network className="w-3.5 h-3.5" />
          <span>Hasil &amp; Rekomendasi Apriori ({data?.associationRules.length || 0})</span>
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
          onClick={() => setActiveTab('gallery')}
          className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'gallery'
              ? 'bg-[#FF5376] text-white shadow-xs'
              : 'bg-white border border-[#FCE2E8] text-[#8C727D] hover:bg-[#FFF0F4] hover:text-[#2D1F24]'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>Kelola Galeri &amp; Layanan ({localDesigns.length})</span>
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

      {/* Tab: Gallery & Services Management */}
      {activeTab === 'gallery' && (
        <div className="space-y-6">
          {/* Top Bar for Gallery Admin */}
          <div className="bg-white border border-[#FCE2E8] rounded-3xl p-6 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="text-base font-bold text-[#2D1F24] flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-[#FF5376]" />
                <span>Katalog Galeri Foto &amp; Layanan Nail Art</span>
              </h3>
              <p className="text-xs text-[#8C727D] mt-0.5">
                Kelola foto desain kuku, nama layanan, tarif harga, kategori gaya, dan deskripsi publik secara langsung.
              </p>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <button
                onClick={handleResetGalleryToDefault}
                className="py-2.5 px-4 bg-white border border-[#FCE2E8] text-[#8C727D] hover:text-[#2D1F24] hover:bg-[#FFF0F4] text-xs font-bold rounded-full transition-all flex items-center gap-1.5 cursor-pointer"
                title="Kembalikan ke 10 motif standar"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset Bawaan</span>
              </button>

              <button
                onClick={handleOpenAddModal}
                className="py-2.5 px-5 bg-[#FF5376] hover:bg-[#FF3E66] text-white text-xs font-bold rounded-full transition-all flex items-center gap-1.5 shadow-sm shadow-pink-200 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Layanan Baru</span>
              </button>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center gap-3 bg-white border border-[#FCE2E8] p-4 rounded-2xl">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="w-3.5 h-3.5 text-[#8C727D] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari motif kuku atau deskripsi..."
                value={gallerySearch}
                onChange={(e) => setGallerySearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-[#FFF0F4] border border-[#FCE2E8] rounded-full text-xs text-[#2D1F24] focus:outline-hidden focus:border-[#FF5376] focus:bg-white transition-all"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              {['Semua', ...CATEGORY_OPTIONS].map(cat => (
                <button
                  key={cat}
                  onClick={() => setGalleryFilter(cat)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                    galleryFilter === cat
                      ? 'bg-[#FF5376] text-white shadow-2xs'
                      : 'bg-[#FFF0F4] text-[#8C727D] hover:text-[#2D1F24] border border-[#FCE2E8]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Gallery Items Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredAdminDesigns.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-[#FCE2E8] rounded-3xl overflow-hidden shadow-2xs hover:shadow-md hover:border-[#FF5376]/40 transition-all flex flex-col group"
              >
                {/* Image Section */}
                <div className="relative aspect-4/3 overflow-hidden bg-[#FFF0F4]">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#2D1F24]/70 via-transparent to-transparent pointer-events-none" />

                  {/* Badges on Top of Image */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span className="px-2.5 py-0.5 bg-white/95 backdrop-blur-xs text-[#2D1F24] text-[10px] font-bold rounded-full shadow-xs">
                      {item.category || 'Minimalis'}
                    </span>
                    {item.tag && (
                      <span className="px-2.5 py-0.5 bg-[#FF5376] text-white text-[10px] font-bold rounded-full shadow-xs">
                        {item.tag}
                      </span>
                    )}
                  </div>

                  <div className="absolute top-3 right-3">
                    <span className="text-[10px] font-mono font-bold bg-white/90 backdrop-blur-xs text-[#2D1F24] px-2 py-0.5 rounded-full shadow-xs">
                      #{item.id}
                    </span>
                  </div>

                  {/* ID and Subtitle on Bottom of Image */}
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <span className="text-[10px] opacity-80 font-mono block">ID: {item.id}</span>
                    <h4 className="text-sm font-bold truncate">{item.name}</h4>
                  </div>
                </div>

                {/* Details Section */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-[#8C727D] font-medium">{item.styleSubtitle || 'Trendy & Cantik'}</span>
                      <span className="text-sm font-bold text-[#FF5376]">{formatRupiah(item.price)}</span>
                    </div>
                    <p className="text-[11px] text-[#8C727D] line-clamp-2 leading-relaxed">
                      {item.description || 'Tidak ada deskripsi.'}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-4 pt-3 border-t border-[#FCE2E8] flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEditModal(item)}
                      className="flex-1 py-2 px-3 bg-[#FFF0F4] hover:bg-[#FFE5EC] text-[#2D1F24] text-xs font-bold rounded-full border border-[#FCE2E8] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-[#FF5376]" />
                      <span>Edit &amp; Ganti Foto</span>
                    </button>

                    <button
                      onClick={() => handleDeleteService(item.id, item.name)}
                      className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-full border border-red-100 transition-all cursor-pointer"
                      title="Hapus Layanan"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredAdminDesigns.length === 0 && (
            <div className="p-10 text-center bg-white rounded-3xl border border-[#FCE2E8]">
              <ImageIcon className="w-10 h-10 text-[#FF5376]/30 mx-auto mb-2" />
              <p className="text-xs font-bold text-[#2D1F24]">Tidak ada motif kuku yang sesuai dengan pencarian.</p>
              <button
                onClick={() => { setGalleryFilter('Semua'); setGallerySearch(''); }}
                className="mt-3 text-xs font-bold text-[#FF5376] underline cursor-pointer"
              >
                Reset Filter Pencarian
              </button>
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
            {/* User Reference Dataset Card */}
            <div className="bg-gradient-to-br from-white to-[#FFF8FA] border border-[#FCD5DF] rounded-3xl p-5 shadow-xs">
              <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-[#FCE2E8]">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-[#FF5376]" />
                  <h4 className="text-xs font-bold text-[#2D1F24]">Dataset Referensi Awal (31 Transaksi)</h4>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-0.5 bg-[#FF5376] text-white rounded-full">
                  Aktif Digunakan
                </span>
              </div>

              <p className="text-[11px] text-[#8C727D] leading-relaxed mb-3">
                Dataset riil 31 transaksi transaksi salon yang Anda berikan telah tersimpan dan menjadi acuan utama pembelajaran algoritma Apriori studio.
              </p>

              <div className="flex flex-wrap gap-1 mb-3.5">
                {['cat eye', 'french crop', 'chrome', '3D bunga', 'merah maron', 'mutiara', 'pink', 'putih', 'pita', 'abstrak', 'manik-manik', 'cokelat gel'].map((tag) => (
                  <span key={tag} className="px-2 py-0.5 bg-[#FFF0F4] text-[#FF5376] border border-[#FCD5DF] rounded-full text-[10px] font-semibold">
                    {tag}
                  </span>
                ))}
              </div>

              <button
                type="button"
                onClick={handleResetToUserDataset}
                disabled={loading}
                className="w-full py-2.5 px-4 bg-white hover:bg-[#FFF0F4] text-[#FF5376] border border-[#FF5376] text-xs font-bold rounded-full transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs disabled:opacity-50"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Terapkan Ulang Dataset Referensi (31 Transaksi)</span>
              </button>
            </div>

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
          {/* Association Rules (Left / First Column for Prominence) */}
          <div className="lg:col-span-7 bg-white border border-[#FCE2E8] rounded-3xl p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-[#FCE2E8]">
              <div>
                <h3 className="text-base font-bold text-[#2D1F24] flex items-center gap-2">
                  <Network className="w-4 h-4 text-[#FF5376]" />
                  <span>Aturan Asosiasi &amp; Rekomendasi Apriori (Confidence &gt;= {(minConfidence * 100).toFixed(0)}%)</span>
                </h3>
                <p className="text-[11px] text-[#8C727D] mt-0.5">
                  Diurutkan dari tingkat keyakinan (<em>Confidence</em>) dan kekuatan korelasi (<em>Lift Ratio</em>) tertinggi
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-[#FFF0F4] text-[#FF5376] border border-[#FCD5DF] text-xs font-extrabold self-start sm:self-auto">
                {data?.associationRules.length || 0} Rules
              </span>
            </div>

            {!data || data.associationRules.length === 0 ? (
              <p className="text-xs text-[#8C727D] text-center py-6">Tidak ada aturan yang memenuhi batas min. confidence.</p>
            ) : (
              <div className="space-y-3 max-h-[32rem] overflow-y-auto pr-1">
                {[...data.associationRules]
                  .sort((a, b) => b.confidence - a.confidence || b.lift - a.lift)
                  .map((rule, i) => {
                    const confPct = formatPct(rule.confidence);
                    const supPct = formatPct(rule.support);
                    const liftStr = formatLift(rule.lift);
                    const antStr = formatRuleSide(rule.antecedent);
                    const consStr = formatRuleSide(rule.consequent);

                    return (
                      <div
                        key={i}
                        className="p-4 bg-[#FFF8FA] hover:bg-white rounded-2xl border border-[#FCE2E8] hover:border-[#FF5376] transition-all text-xs shadow-2xs"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                          <div className="flex flex-wrap items-center gap-1.5 font-bold text-xs">
                            <span className="px-2 py-0.5 rounded-full bg-[#2D1F24] text-white text-[10px] font-extrabold">
                              #{i + 1}
                            </span>
                            <span className="text-[#2D1F24] px-2.5 py-1 bg-white border border-[#FCD5DF] rounded-full capitalize">
                              Jika: {antStr}
                            </span>
                            <span className="text-[#FF5376] font-extrabold text-sm">&rarr;</span>
                            <span className="text-white px-2.5 py-1 bg-[#FF5376] rounded-full capitalize shadow-2xs">
                              Maka: {consStr}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                              Lift: {liftStr}x
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full bg-white text-[#8C727D] border border-[#FCE2E8] text-[10px] font-bold">
                              Support: {supPct}%
                            </span>
                          </div>
                        </div>

                        {/* Confidence Bar */}
                        <div className="mb-2">
                          <div className="flex items-center justify-between text-[10px] mb-1">
                            <span className="font-semibold text-[#8C727D]">Tingkat Keyakinan (Confidence):</span>
                            <span className="font-extrabold text-[#FF5376] text-xs">{confPct}%</span>
                          </div>
                          <div className="w-full h-2 bg-white rounded-full overflow-hidden border border-[#FCE2E8]">
                            <div
                              className="h-full bg-gradient-to-r from-[#FF5376] to-[#FF8DA6] rounded-full"
                              style={{ width: `${Math.min(100, Number(confPct))}%` }}
                            />
                          </div>
                        </div>

                        <p className="text-[11px] text-[#8C727D]">
                          Pelanggan yang memesan <strong className="text-[#2D1F24] capitalize">{antStr}</strong> memiliki kecenderungan{' '}
                          <strong className="text-[#FF5376]">{confPct}%</strong> untuk turut memilih{' '}
                          <strong className="text-[#2D1F24] capitalize">{consStr}</strong>.
                        </p>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          {/* Frequent Itemsets (Right Column with L1 / L2+ Filter) */}
          <div className="lg:col-span-5 bg-white border border-[#FCE2E8] rounded-3xl p-6 shadow-xs">
            <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-[#FCE2E8]">
              <h3 className="text-base font-bold text-[#2D1F24]">
                Frequent Itemsets (Support &gt;= {(minSupport * 100).toFixed(0)}%)
              </h3>
              <span className="text-xs text-[#FF5376] font-extrabold">{data?.frequentItemsets.length || 0} Sets</span>
            </div>

            {/* Filter Pills: Semua vs Kombinasi (k>=2) vs Tunggal (k=1) */}
            <div className="flex items-center gap-1.5 mb-3">
              {[
                { id: 'all', label: 'Semua' },
                { id: 'bundles', label: 'Kombinasi (k ≥ 2)' },
                { id: 'single', label: 'Tunggal (k = 1)' }
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setItemsetFilter(tab.id as 'all' | 'bundles' | 'single')}
                  className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                    itemsetFilter === tab.id
                      ? 'bg-[#FF5376] text-white shadow-2xs'
                      : 'bg-[#FFF0F4] text-[#8C727D] hover:text-[#2D1F24] border border-[#FCE2E8]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {!data || data.frequentItemsets.length === 0 ? (
              <p className="text-xs text-[#8C727D] text-center py-6">Tidak ada itemset yang memenuhi nilai min. support.</p>
            ) : (
              <div className="space-y-2.5 max-h-[30rem] overflow-y-auto pr-1">
                {[...data.frequentItemsets]
                  .filter(it =>
                    itemsetFilter === 'bundles'
                      ? it.k >= 2 || it.items.length >= 2
                      : itemsetFilter === 'single'
                        ? (it.k === 1 || it.items.length === 1)
                        : true
                  )
                  .sort((a, b) => b.support - a.support)
                  .map((itemset, i) => {
                    const supPct = formatPct(itemset.support);
                    return (
                      <div
                        key={i}
                        className="p-3 bg-[#FFF0F4] rounded-2xl border border-[#FCE2E8] text-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-1">
                            <span className="px-2 py-0.5 bg-[#FF5376] text-white font-extrabold text-[9px] rounded-full">
                              L{itemset.k || itemset.items.length}
                            </span>
                            {itemset.items.map((it, idx) => (
                              <span key={idx} className="px-2.5 py-0.5 bg-white text-[#2D1F24] font-bold text-[10px] rounded-full border border-[#FCD5DF] capitalize">
                                {it}
                              </span>
                            ))}
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-[11px] text-[#FF5376] font-extrabold block">{supPct}%</span>
                            <span className="text-[9px] text-[#8C727D] block">{itemset.count} Transaksi</span>
                          </div>
                        </div>
                        <div className="w-full h-1.5 bg-white rounded-full overflow-hidden border border-[#FCE2E8]">
                          <div
                            className="h-full bg-[#FF5376] rounded-full"
                            style={{ width: `${Math.min(100, Number(supPct))}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Dialog for Add / Edit Nail Service & Photo */}
      <AnimatePresence>
        {isServiceModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsServiceModalOpen(false)}
              className="absolute inset-0 bg-[#2D1F24]/60 backdrop-blur-xs"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-2xl bg-white border border-[#FCE2E8] rounded-3xl p-6 sm:p-8 shadow-2xl z-10 max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-[#FCE2E8]">
                <div>
                  <span className="text-[10px] font-bold text-[#FF5376] bg-[#FFF0F4] px-3 py-1 rounded-full uppercase border border-[#FCD5DF]">
                    {editingServiceId ? 'EDIT LAYANAN' : 'TAMBAH LAYANAN BARU'}
                  </span>
                  <h3 className="text-xl font-sans font-bold text-[#2D1F24] mt-1.5">
                    {editingServiceId ? 'Edit Motif Kuku & Foto Galeri' : 'Tambah Motif Kuku ke Galeri'}
                  </h3>
                </div>
                <button
                  onClick={() => setIsServiceModalOpen(false)}
                  className="p-2 text-[#8C727D] hover:text-[#2D1F24] rounded-full hover:bg-[#FFF0F4] transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleSaveService} className="space-y-4 text-left">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Nama Motif */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#2D1F24]">Nama Layanan / Desain *</label>
                    <input
                      type="text"
                      required
                      placeholder="contoh: Daisy Nude & Floral"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2.5 bg-[#FFF0F4] border border-[#FCE2E8] rounded-2xl text-xs text-[#2D1F24] focus:outline-hidden focus:border-[#FF5376] focus:bg-white transition-all"
                    />
                  </div>

                  {/* Tarif Harga */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#2D1F24]">Tarif Harga (IDR) *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="5000"
                      placeholder="120000"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 bg-[#FFF0F4] border border-[#FCE2E8] rounded-2xl text-xs text-[#2D1F24] focus:outline-hidden focus:border-[#FF5376] focus:bg-white transition-all"
                    />
                  </div>

                  {/* Kategori Gaya */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#2D1F24]">Kategori Gaya</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-2.5 bg-[#FFF0F4] border border-[#FCE2E8] rounded-2xl text-xs text-[#2D1F24] focus:outline-hidden focus:border-[#FF5376] focus:bg-white transition-all"
                    >
                      {CATEGORY_OPTIONS.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  {/* Badge Tag */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#2D1F24]">Label Tag / Badge</label>
                    <select
                      value={formData.tag}
                      onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                      className="w-full px-4 py-2.5 bg-[#FFF0F4] border border-[#FCE2E8] rounded-2xl text-xs text-[#2D1F24] focus:outline-hidden focus:border-[#FF5376] focus:bg-white transition-all"
                    >
                      {TAG_OPTIONS.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  {/* Subjudul Gaya */}
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-bold text-[#2D1F24]">Subjudul Gaya (Singkat)</label>
                    <input
                      type="text"
                      placeholder="contoh: Natural, Feminim"
                      value={formData.styleSubtitle}
                      onChange={(e) => setFormData({ ...formData, styleSubtitle: e.target.value })}
                      className="w-full px-4 py-2.5 bg-[#FFF0F4] border border-[#FCE2E8] rounded-2xl text-xs text-[#2D1F24] focus:outline-hidden focus:border-[#FF5376] focus:bg-white transition-all"
                    />
                  </div>
                </div>

                {/* Foto Galeri Kuku (Upload File, Preset, atau URL) */}
                <div className="space-y-3 pt-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <label className="text-xs font-bold text-[#2D1F24] flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-[#FF5376]" />
                      <span>Foto Desain Kuku *</span>
                    </label>

                    {/* Mode Selector Tabs */}
                    <div className="flex items-center gap-1 bg-[#FFF0F4] p-1 rounded-full border border-[#FCE2E8] self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={() => setPhotoSourceMode('upload')}
                        className={`px-3 py-1 text-[10px] font-bold rounded-full transition-all cursor-pointer flex items-center gap-1 ${
                          photoSourceMode === 'upload'
                            ? 'bg-[#FF5376] text-white shadow-2xs'
                            : 'text-[#8C727D] hover:text-[#2D1F24]'
                        }`}
                      >
                        <UploadCloud className="w-3 h-3" />
                        <span>Upload File</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPhotoSourceMode('preset')}
                        className={`px-3 py-1 text-[10px] font-bold rounded-full transition-all cursor-pointer flex items-center gap-1 ${
                          photoSourceMode === 'preset'
                            ? 'bg-[#FF5376] text-white shadow-2xs'
                            : 'text-[#8C727D] hover:text-[#2D1F24]'
                        }`}
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Pilih Preset</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPhotoSourceMode('url')}
                        className={`px-3 py-1 text-[10px] font-bold rounded-full transition-all cursor-pointer flex items-center gap-1 ${
                          photoSourceMode === 'url'
                            ? 'bg-[#FF5376] text-white shadow-2xs'
                            : 'text-[#8C727D] hover:text-[#2D1F24]'
                        }`}
                      >
                        <LinkIcon className="w-3 h-3" />
                        <span>Link URL</span>
                      </button>
                    </div>
                  </div>

                  {/* Mode 1: Direct File Upload (Drag & Drop + Click to Browse) */}
                  {photoSourceMode === 'upload' && (
                    <div className="space-y-2">
                      <input
                        ref={photoFileInputRef}
                        type="file"
                        accept="image/png, image/jpeg, image/jpg, image/webp, image/gif"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            handlePhotoFileSelected(e.target.files[0]);
                          }
                        }}
                      />

                      {/* Dropzone Container */}
                      <div
                        onDragOver={handlePhotoDragOver}
                        onDragLeave={handlePhotoDragLeave}
                        onDrop={handlePhotoDrop}
                        onClick={() => photoFileInputRef.current?.click()}
                        className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-2 group ${
                          isPhotoDragging
                            ? 'border-[#FF5376] bg-[#FFE5EC] scale-[1.01] shadow-md'
                            : 'border-[#FCD5DF] bg-[#FFF8FA] hover:border-[#FF5376] hover:bg-[#FFF0F4]'
                        }`}
                      >
                        {isProcessingPhoto ? (
                          <div className="py-4 flex flex-col items-center gap-2 text-[#FF5376]">
                            <RefreshCw className="w-8 h-8 animate-spin" />
                            <span className="text-xs font-bold">Sedang memproses &amp; mengoptimalkan foto...</span>
                          </div>
                        ) : (
                          <>
                            <div className="w-12 h-12 rounded-full bg-white border border-[#FCD5DF] flex items-center justify-center text-[#FF5376] group-hover:scale-110 group-hover:border-[#FF5376] transition-all shadow-xs">
                              <UploadCloud className="w-6 h-6" />
                            </div>

                            <div className="space-y-1">
                              <p className="text-xs font-bold text-[#2D1F24]">
                                <span className="text-[#FF5376] underline underline-offset-2">Klik untuk telusuri foto</span> atau tarik &amp; lepas file ke sini
                              </p>
                              <p className="text-[10px] text-[#8C727D]">
                                Format JPG, PNG, WEBP, atau foto kamera langsung (Maks. 20MB &bull; Kompresi Otomatis)
                              </p>
                            </div>

                            <div className="mt-1 inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-[#FCD5DF] rounded-full text-[10px] font-bold text-[#2D1F24] shadow-2xs">
                              <Camera className="w-3 h-3 text-[#FF5376]" />
                              <span>Pilih dari Galeri HP / Komputer</span>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Upload Error feedback */}
                      {photoUploadError && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>{photoUploadError}</span>
                        </div>
                      )}

                      {/* File Compression Success Info */}
                      {photoFileInfo && (
                        <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-[11px] flex items-center justify-between">
                          <div className="flex items-center gap-2 truncate">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span className="font-bold truncate">{photoFileInfo.name}</span>
                          </div>
                          <span className="text-[10px] bg-emerald-100 px-2 py-0.5 rounded-full font-semibold shrink-0">
                            {photoFileInfo.origSize} &rarr; {photoFileInfo.compSize} (Ringan)
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Mode 2: Preset Gallery Picker */}
                  {photoSourceMode === 'preset' && (
                    <div className="p-3 bg-[#FFF0F4] rounded-2xl border border-[#FCE2E8]">
                      <span className="text-[10px] font-bold text-[#8C727D] uppercase block mb-2">
                        Klik salah satu foto estetik studio untuk digunakan:
                      </span>
                      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 max-h-48 overflow-y-auto p-1">
                        {PRESET_GALLERY_IMAGES.map((preset, idx) => (
                          <div
                            key={idx}
                            onClick={() => {
                              setFormData({ ...formData, image: preset.url });
                              setPhotoFileInfo(null);
                            }}
                            className={`aspect-square rounded-xl overflow-hidden border transition-all cursor-pointer relative group ${
                              formData.image === preset.url
                                ? 'border-[#FF5376] ring-2 ring-[#FF5376]/40 scale-105 shadow-xs'
                                : 'border-[#FCD5DF] hover:border-[#FF5376] hover:scale-105'
                            }`}
                            title={preset.name}
                          >
                            <img
                              src={preset.url}
                              alt={preset.name}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                            {formData.image === preset.url && (
                              <div className="absolute inset-0 bg-[#FF5376]/30 flex items-center justify-center">
                                <Check className="w-4 h-4 text-white drop-shadow-sm" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Mode 3: Direct URL Link input */}
                  {photoSourceMode === 'url' && (
                    <div className="space-y-1">
                      <input
                        type="url"
                        placeholder="https://images.unsplash.com/photo-..."
                        value={formData.image}
                        onChange={(e) => {
                          setFormData({ ...formData, image: e.target.value });
                          setPhotoFileInfo(null);
                        }}
                        className="w-full px-4 py-2.5 bg-[#FFF0F4] border border-[#FCE2E8] rounded-2xl text-xs text-[#2D1F24] focus:outline-hidden focus:border-[#FF5376] focus:bg-white transition-all"
                      />
                      <p className="text-[10px] text-[#8C727D] pl-1">
                        Masukkan tautan langsung gambar foto (HTTPS).
                      </p>
                    </div>
                  )}

                  {/* Live Photo & Service Card Preview */}
                  <div className="p-3.5 bg-[#FFF0F4] rounded-2xl border border-[#FCE2E8] flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white border border-[#FCD5DF] shrink-0 shadow-2xs relative group">
                        <img
                          src={formData.image || 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=600&auto=format&fit=crop'}
                          alt="Preview"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=600&auto=format&fit=crop';
                          }}
                        />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold text-[#8C727D] uppercase block">
                          Pratinjau Foto Galeri Aktif:
                        </span>
                        <p className="text-xs font-bold text-[#2D1F24] truncate">
                          {formData.name || 'Nama Desain Kuku'}
                        </p>
                        <p className="text-[10px] text-[#FF5376] font-semibold flex items-center gap-1.5 mt-0.5">
                          <span>{formatRupiah(formData.price)}</span>
                          <span>&bull;</span>
                          <span className="px-1.5 py-0.2 bg-white rounded-md border border-[#FCD5DF] text-[#2D1F24]">
                            {formData.category}
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Quick action to trigger file upload */}
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoSourceMode('upload');
                        setTimeout(() => photoFileInputRef.current?.click(), 50);
                      }}
                      className="py-1.5 px-3 bg-white hover:bg-[#FFE5EC] border border-[#FCD5DF] text-[#FF5376] text-[11px] font-bold rounded-full transition-all shrink-0 cursor-pointer flex items-center gap-1"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Ganti Foto File</span>
                      <span className="sm:hidden">Ganti</span>
                    </button>
                  </div>
                </div>

                {/* Deskripsi Lengkap */}
                <div className="space-y-1 pt-1">
                  <label className="text-xs font-bold text-[#2D1F24]">Deskripsi Desain &amp; Perawatan</label>
                  <textarea
                    rows={3}
                    placeholder="Jelaskan keistimewaan motif, warna dasar kuku, atau detail aksesoris..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#FFF0F4] border border-[#FCE2E8] rounded-2xl text-xs text-[#2D1F24] focus:outline-hidden focus:border-[#FF5376] focus:bg-white transition-all resize-none"
                  />
                </div>

                {/* Submit & Cancel Buttons */}
                <div className="pt-4 border-t border-[#FCE2E8] flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsServiceModalOpen(false)}
                    className="py-2.5 px-5 bg-white border border-[#FCE2E8] text-[#8C727D] hover:bg-[#FFF0F4] text-xs font-bold rounded-full transition-all cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="py-2.5 px-6 bg-[#FF5376] hover:bg-[#FF3E66] text-white text-xs font-bold rounded-full transition-all shadow-md shadow-pink-200 cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>{editingServiceId ? 'Simpan Perubahan' : 'Terbitkan ke Galeri'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
