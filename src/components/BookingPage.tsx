import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calendar, Clock, Phone, User, Mail, Sparkles, Check, Trash2,
  Heart, Plus, ArrowLeft, Search, ShieldCheck, CheckCircle2,
  Printer, Send, HelpCircle, AlertCircle, RefreshCw, Scissors
} from 'lucide-react';
import { NailDesign, Booking, RecommendationData } from '../types';

interface BookingPageProps {
  designs: NailDesign[];
  recommendations: RecommendationData | null;
  selectedServices: string[];
  onAddService: (serviceId: string) => void;
  onRemoveService: (serviceId: string) => void;
  onClearServices: () => void;
  onNavigateHome: () => void;
  onBookingSuccess: (booking: Booking) => void;
}

const TIME_SLOTS = [
  { time: "09:00", session: "Pagi", available: true },
  { time: "10:30", session: "Pagi", available: true },
  { time: "12:00", session: "Siang", available: true },
  { time: "13:30", session: "Siang", available: true },
  { time: "15:00", session: "Sore", available: true },
  { time: "16:30", session: "Sore", available: true },
  { time: "18:00", session: "Malam", available: true },
  { time: "19:30", session: "Malam", available: true }
];

const NAIL_SHAPES = [
  { id: 'natural', name: 'Natural Round', desc: 'Alami & Rapi' },
  { id: 'almond', name: 'Almond', desc: 'Ramping & Feminin' },
  { id: 'oval', name: 'Classic Oval', desc: 'Anggun & Elegan' },
  { id: 'coffin', name: 'Ballerina Coffin', desc: 'Trendy & Bold' },
  { id: 'square', name: 'Square Straight', desc: 'Tegas & Modern' }
];

const NAIL_STYLISTS = [
  { id: 'any', name: 'Siapa Saja (Terapis Siap)', role: 'Jadwal Fleksibel', experience: 'Semua Terapis Tersertifikasi' },
  { id: 'jessica', name: 'Jessica Anggraini', role: 'Senior Nail Artist', experience: 'Spesialis Korean Art & 3D' },
  { id: 'bella', name: 'Bella Safitri', role: 'Master Nail Stylist', experience: 'Spesialis French & Minimalist' },
  { id: 'clara', name: 'Clara Novita', role: 'Creative Nail Stylist', experience: 'Spesialis Glitter & Cat Eye' }
];

export default function BookingPage({
  designs,
  recommendations,
  selectedServices,
  onAddService,
  onRemoveService,
  onClearServices,
  onNavigateHome,
  onBookingSuccess
}: BookingPageProps) {
  // Page mode: 'form' (create reservation) or 'track' (lookup reservation status)
  const [activeTab, setActiveTab] = useState<'form' | 'track'>('form');

  // Form Fields
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    date: '',
    time: '',
    nailShape: 'almond',
    stylist: 'any',
    notes: ''
  });

  // Search & Filter inside service picker
  const [serviceSearch, setServiceSearch] = useState('');
  const [serviceCategory, setServiceCategory] = useState('Semua');

  // Submission State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successBooking, setSuccessBooking] = useState<Booking | null>(null);

  // Tracking State
  const [trackBookingId, setTrackBookingId] = useState('');
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingResult, setTrackingResult] = useState<Booking | null>(null);
  const [trackingError, setTrackingError] = useState<string | null>(null);

  // Dynamic Apriori Upsell Suggestion
  const [upsellSuggestion, setUpsellSuggestion] = useState<NailDesign | null>(null);
  const [matchedRule, setMatchedRule] = useState<{ antecedent: string; consequent: string; confidence: number; lift: number } | null>(null);

  // Auto-fill tomorrow's date by default
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    setFormData(prev => ({
      ...prev,
      date: prev.date || dateStr
    }));
  }, []);

  // Compute total estimate
  const totalEstimate = selectedServices.reduce((acc, id) => {
    const design = designs.find(d => d.id === id);
    return acc + (design ? design.price : 0);
  }, 0);

  // Estimated duration in minutes
  const estimatedDuration = Math.max(45, selectedServices.length * 40);

  // Apriori AI Smart Upsell
  useEffect(() => {
    if (selectedServices.length === 0 || !recommendations || !recommendations.recommendations) {
      // Pick first unselected best seller
      const unselected = designs.filter(d => !selectedServices.includes(d.id));
      setUpsellSuggestion(unselected.length > 0 ? unselected[0] : null);
      setMatchedRule(null);
      return;
    }

    const activeRules = recommendations.recommendations;
    const normalize = (str: string) => str.toLowerCase().replace(/[-_]/g, ' ').trim();

    // Check if an item matches a selected service ID or design
    const matchesService = (itemName: string, serviceId: string) => {
      const design = designs.find(d => d.id === serviceId);
      const normItem = normalize(itemName);
      const normId = normalize(serviceId);
      if (normId === normItem || normId.includes(normItem) || normItem.includes(normId)) return true;
      if (design) {
        const normName = normalize(design.name);
        if (normName === normItem || normName.includes(normItem) || normItem.includes(normName)) return true;
      }
      return false;
    };

    // Find the design for a consequent item
    const findDesignForItem = (itemName: string) => {
      const normItem = normalize(itemName);
      return designs.find(d => {
        const normId = normalize(d.id);
        const normName = normalize(d.name);
        return normId === normItem || normName === normItem || normId.includes(normItem) || normName.includes(normItem) || normItem.includes(normId) || normItem.includes(normName);
      });
    };

    let foundRule: any = null;
    let foundDesign: NailDesign | null = null;

    for (const rule of activeRules) {
      const antItems = rule.antecedent.split(',').map(i => i.trim());
      const consItems = rule.consequent.split(',').map(i => i.trim());

      // All antecedent items should be present in selected services
      const antecedentMatched = antItems.every(ant => selectedServices.some(svcId => matchesService(ant, svcId)));
      // Consequent should not already be selected
      const unselectedCons = consItems.filter(cons => !selectedServices.some(svcId => matchesService(cons, svcId)));

      if (antecedentMatched && unselectedCons.length > 0) {
        for (const cons of unselectedCons) {
          const design = findDesignForItem(cons);
          if (design && !selectedServices.includes(design.id)) {
            foundDesign = design;
            foundRule = rule;
            break;
          }
        }
        if (foundDesign) break;
      }
    }

    if (foundDesign) {
      setUpsellSuggestion(foundDesign);
      setMatchedRule(foundRule);
    } else {
      const unselected = designs.filter(d => !selectedServices.includes(d.id));
      setUpsellSuggestion(unselected.length > 0 ? unselected[0] : null);
      setMatchedRule(null);
    }
  }, [selectedServices, recommendations, designs]);

  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (selectedServices.length === 0) {
      setError("Silakan pilih minimal 1 desain/layanan kuku untuk perawatan Anda.");
      return;
    }

    if (!formData.time) {
      setError("Silakan pilih jam kunjungan yang tersedia.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          date: formData.date,
          time: formData.time,
          services: selectedServices,
          nailShape: formData.nailShape,
          stylist: formData.stylist,
          notes: formData.notes
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal memproses reservasi.");
      }

      setSuccessBooking(data.booking);
      onBookingSuccess(data.booking);
      onClearServices();
      setFormData({
        name: '',
        email: '',
        phone: '',
        date: '',
        time: '',
        nailShape: 'almond',
        stylist: 'any',
        notes: ''
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat memproses booking.");
    } finally {
      setLoading(false);
    }
  };

  // Lookup booking status
  const handleTrackBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackBookingId.trim()) return;

    setTrackingLoading(true);
    setTrackingError(null);
    setTrackingResult(null);

    try {
      const res = await fetch(`/api/public/bookings/${encodeURIComponent(trackBookingId.trim())}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Nomor reservasi tidak ditemukan.");
      }
      setTrackingResult(data.booking);
    } catch (err: any) {
      setTrackingError(err.message || "Gagal memeriksa status reservasi.");
    } finally {
      setTrackingLoading(false);
    }
  };

  // Filtered designs inside booking catalog
  const filteredDesigns = designs.filter(design => {
    const matchesCat = serviceCategory === 'Semua' || (design.category && design.category.toLowerCase() === serviceCategory.toLowerCase());
    const matchesQuery = !serviceSearch ||
      design.name.toLowerCase().includes(serviceSearch.toLowerCase()) ||
      (design.description && design.description.toLowerCase().includes(serviceSearch.toLowerCase())) ||
      (design.styleSubtitle && design.styleSubtitle.toLowerCase().includes(serviceSearch.toLowerCase()));
    return matchesCat && matchesQuery;
  });

  const CATEGORIES = ['Semua', 'Minimalis', 'Elegant', 'Korea Style', 'Classic', 'Glitter', 'Cute', 'Colorful'];

  // Success E-Ticket View
  if (successBooking) {
    const waText = encodeURIComponent(
      `Halo Nailove Studio! ✨ Saya sudah melakukan reservasi dengan nomor *${successBooking.id}* atas nama *${successBooking.name}* untuk tanggal *${successBooking.date}* jam *${successBooking.time} WIB*. Mohon dikonfirmasi ya, terima kasih!`
    );

    return (
      <div className="py-10 px-4 max-w-3xl mx-auto text-left" id="booking-success-view">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white border border-[#FCD5DF] rounded-3xl p-6 sm:p-10 text-center shadow-xl relative overflow-hidden"
        >
          {/* Decorative Corner Ribbon */}
          <div className="absolute top-0 right-0 w-32 h-32 overflow-hidden pointer-events-none">
            <div className="bg-[#FF5376] text-white text-[10px] font-bold py-1 w-44 text-center transform rotate-45 translate-x-10 translate-y-7 shadow-sm">
              TERDAFTAR RESMI
            </div>
          </div>

          <div className="w-20 h-20 bg-[#FFF0F4] rounded-full flex items-center justify-center text-[#FF5376] mx-auto mb-5 border-2 border-[#FCD5DF] shadow-xs">
            <Check className="w-10 h-10 stroke-[2.5]" />
          </div>

          <span className="text-[10px] font-bold tracking-wider text-[#FF5376] bg-[#FFF0F4] px-4 py-1.5 rounded-full border border-[#FCD5DF] uppercase">
            PEMESANAN BERHASIL DIKONFIRMASI
          </span>

          <h2 className="text-2xl sm:text-3xl font-sans font-extrabold text-[#2D1F24] mt-3 tracking-tight">
            Jadwal Cantik Anda Terdaftar! ✨
          </h2>

          <p className="text-[#8C727D] text-xs sm:text-sm mt-2 max-w-md mx-auto leading-relaxed">
            Terima kasih telah memilih <strong>Nailove Studio</strong>. Bukti reservasi ini telah tersimpan dalam sistem kami.
          </p>

          {/* Virtual Booking Card / E-Ticket */}
          <div className="my-8 p-6 bg-[#FFF8FA] border-2 border-dashed border-[#FCD5DF] rounded-3xl text-left space-y-3.5 text-xs text-[#2D1F24] relative">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center pb-3 border-b border-[#FCE2E8] gap-1">
              <div>
                <span className="text-[10px] text-[#8C727D] uppercase font-bold tracking-wider block">KODE RESERVASI</span>
                <span className="font-mono text-base font-bold text-[#FF5376] tracking-wide">{successBooking.id}</span>
              </div>
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 font-bold text-[11px] rounded-full border border-emerald-200 self-start sm:self-auto flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Menunggu Kedatangan</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <span className="text-[10px] text-[#8C727D] block">Nama Pelanggan:</span>
                <span className="font-bold text-sm text-[#2D1F24]">{successBooking.name}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#8C727D] block">Kontak WhatsApp:</span>
                <span className="font-bold text-sm text-[#2D1F24]">{successBooking.phone}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#8C727D] block">Tanggal Kedatangan:</span>
                <span className="font-bold text-sm text-[#FF5376] flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {successBooking.date}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[#8C727D] block">Jam Treatment:</span>
                <span className="font-bold text-sm text-[#FF5376] flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {successBooking.time} WIB
                </span>
              </div>
            </div>

            {/* List of Services */}
            <div className="pt-3 border-t border-[#FCE2E8]">
              <span className="text-[10px] text-[#8C727D] uppercase font-bold tracking-wider block mb-2">
                LAYANAN &amp; MOTIF KUKU DIPILIH:
              </span>
              <div className="space-y-1.5">
                {successBooking.services.map((svc, i) => {
                  const match = designs.find(d => d.id === svc);
                  return (
                    <div key={i} className="flex justify-between items-center py-1 border-b border-[#FCE2E8]/60 text-xs">
                      <span className="font-semibold text-[#2D1F24] flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#FF5376]" />
                        {match ? match.name : svc.replace(/_/g, ' ')}
                      </span>
                      <span className="font-bold text-[#FF5376]">
                        {match ? formatRupiah(match.price) : '-'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Studio Note */}
            <div className="p-3 bg-[#FFF0F4] rounded-2xl border border-[#FCE2E8] text-[11px] text-[#8C727D] leading-relaxed flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-[#FF5376] shrink-0 mt-0.5" />
              <span>
                Mohon hadir 10 menit sebelum waktu reservasi. Jika ada keterlambatan atau ingin mengubah jadwal, silakan hubungi customer service kami melalui WhatsApp.
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href={`https://api.whatsapp.com/send?phone=6281234567890&text=${waText}`}
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto py-3 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-full transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Konfirmasi via WhatsApp</span>
            </a>

            <button
              onClick={() => window.print()}
              className="w-full sm:w-auto py-3 px-6 bg-white hover:bg-[#FFF0F4] border border-[#FCD5DF] text-[#2D1F24] font-bold text-xs rounded-full transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
            >
              <Printer className="w-4 h-4 text-[#FF5376]" />
              <span>Cetak / Simpan Tiket</span>
            </button>

            <button
              onClick={() => setSuccessBooking(null)}
              className="w-full sm:w-auto py-3 px-6 bg-[#FF5376] hover:bg-[#FF3E66] text-white font-bold text-xs rounded-full transition-all flex items-center justify-center gap-2 shadow-md shadow-pink-200 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Reservasi Baru</span>
            </button>
          </div>

          <div className="mt-6 pt-4 border-t border-[#FCE2E8]">
            <button
              onClick={onNavigateHome}
              className="text-xs font-bold text-[#8C727D] hover:text-[#FF5376] transition-colors inline-flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Katalog &amp; Beranda Utama</span>
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="py-6 sm:py-10 px-4 max-w-7xl mx-auto text-left" id="booking-dedicated-page">
      {/* Top Breadcrumb & Page Banner */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#FCE2E8]">
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={onNavigateHome}
              className="text-[#8C727D] hover:text-[#FF5376] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Beranda</span>
            </button>
            <span className="text-[#FCD5DF]">/</span>
            <span className="text-[#FF5376] font-bold">Halaman Khusus Booking Nail Art</span>
          </div>

          {/* Tab Toggle: Buat Reservasi vs Lacak Status */}
          <div className="flex items-center gap-1 bg-[#FFF0F4] p-1 rounded-full border border-[#FCE2E8]">
            <button
              onClick={() => setActiveTab('form')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'form'
                  ? 'bg-[#FF5376] text-white shadow-xs'
                  : 'text-[#8C727D] hover:text-[#2D1F24]'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Reservasi Baru</span>
            </button>

            <button
              onClick={() => setActiveTab('track')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'track'
                  ? 'bg-[#FF5376] text-white shadow-xs'
                  : 'text-[#8C727D] hover:text-[#2D1F24]'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Cek Status Booking</span>
            </button>
          </div>
        </div>

        {/* Dedicated Page Hero Banner */}
        <div className="mt-6 bg-gradient-to-r from-[#FFF0F4] via-[#FFE5EC] to-[#FFDDE6] border border-[#FCD5DF] rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-xs">
          <div className="max-w-2xl relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/90 border border-[#FCD5DF] rounded-full text-[#FF5376] text-[10px] font-bold uppercase mb-2 shadow-2xs">
              <Sparkles className="w-3 h-3" />
              <span>SISTEM RESERVASI RESMI NAILOVE STUDIO</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-sans font-extrabold text-[#2D1F24] tracking-tight">
              Halaman Khusus Booking &amp; Jadwal Treatment
            </h1>
            <p className="text-xs sm:text-sm text-[#8C727D] mt-2 leading-relaxed">
              Pilih motif desain favorit dari galeri, tentukan jadwal kunjungan, dan dapatkan pelayanan premium dari terapis profesional kami dengan garansi keindahan 7 hari.
            </p>
          </div>

          <div className="absolute right-4 -bottom-6 opacity-20 pointer-events-none hidden md:block">
            <Sparkles className="w-48 h-48 text-[#FF5376]" />
          </div>
        </div>
      </div>

      {/* VIEW 2: TRACK BOOKING STATUS */}
      {activeTab === 'track' && (
        <div className="max-w-2xl mx-auto py-6">
          <div className="bg-white border border-[#FCE2E8] rounded-3xl p-6 sm:p-8 shadow-xs">
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-full bg-[#FFF0F4] border border-[#FCD5DF] text-[#FF5376] flex items-center justify-center mx-auto mb-3">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#2D1F24]">Lacak &amp; Cek Status Reservasi Anda</h3>
              <p className="text-xs text-[#8C727D] mt-1">
                Masukkan Kode Reservasi yang Anda dapatkan saat booking (contoh: <span className="font-mono font-bold text-[#FF5376]">BK-001</span>).
              </p>
            </div>

            <form onSubmit={handleTrackBooking} className="flex gap-2">
              <input
                type="text"
                required
                placeholder="Masukkan Kode Booking (e.g. BK-xxxx)..."
                value={trackBookingId}
                onChange={(e) => setTrackBookingId(e.target.value)}
                className="flex-1 px-4 py-3 bg-[#FFF0F4] border border-[#FCE2E8] rounded-full text-xs text-[#2D1F24] focus:outline-hidden focus:border-[#FF5376] focus:bg-white transition-all shadow-2xs font-mono"
              />
              <button
                type="submit"
                disabled={trackingLoading}
                className="px-6 py-3 bg-[#FF5376] hover:bg-[#FF3E66] text-white font-bold text-xs rounded-full transition-all shadow-md shadow-pink-200 cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                {trackingLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Cari Jadwal</span>
                  </>
                )}
              </button>
            </form>

            {trackingError && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{trackingError}</span>
              </div>
            )}

            {trackingResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-6 bg-[#FFF8FA] border border-[#FCD5DF] rounded-3xl text-left space-y-3"
              >
                <div className="flex justify-between items-center pb-3 border-b border-[#FCE2E8]">
                  <div>
                    <span className="text-[10px] text-[#8C727D] uppercase font-bold block">KODE BOOKING</span>
                    <span className="font-mono text-base font-bold text-[#FF5376]">{trackingResult.id}</span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[11px] font-bold border ${
                    trackingResult.status === 'completed'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {trackingResult.status === 'completed' ? 'Selesai / Dituntaskan' : 'Menunggu Kedatangan'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[#8C727D] block">Nama:</span>
                    <span className="font-bold text-[#2D1F24]">{trackingResult.name}</span>
                  </div>
                  <div>
                    <span className="text-[#8C727D] block">WhatsApp:</span>
                    <span className="font-bold text-[#2D1F24]">{trackingResult.phone}</span>
                  </div>
                  <div>
                    <span className="text-[#8C727D] block">Tanggal:</span>
                    <span className="font-bold text-[#FF5376]">{trackingResult.date}</span>
                  </div>
                  <div>
                    <span className="text-[#8C727D] block">Jam:</span>
                    <span className="font-bold text-[#FF5376]">{trackingResult.time} WIB</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#FCE2E8]">
                  <span className="text-[10px] text-[#8C727D] uppercase font-bold block mb-1">Layanan Dipesan:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {trackingResult.services.map((s, idx) => (
                      <span key={idx} className="px-2.5 py-1 bg-white border border-[#FCD5DF] rounded-full text-[11px] font-semibold text-[#2D1F24]">
                        {s.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 1: DEDICATED RESERVATION FORM & SERVICE SELECTOR */}
      {activeTab === 'form' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main 7 Columns: Step-by-Step Configuration */}
          <div className="lg:col-span-7 space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* STEP 1: Pilih Desain & Layanan Kuku dari Galeri */}
            <div className="bg-white border border-[#FCE2E8] rounded-3xl p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-4 border-b border-[#FCE2E8]">
                <div>
                  <span className="text-[10px] font-bold text-[#FF5376] uppercase tracking-wider bg-[#FFF0F4] px-2.5 py-0.5 rounded-full border border-[#FCD5DF]">
                    LANGKAH 1 DARI 3
                  </span>
                  <h3 className="text-base font-bold text-[#2D1F24] mt-1 flex items-center gap-2">
                    <span>Pilih Desain &amp; Layanan Kuku</span>
                    <span className="text-xs text-[#8C727D] font-normal">
                      ({selectedServices.length} dipilih)
                    </span>
                  </h3>
                </div>

                <div className="text-xs text-[#8C727D]">
                  Bisa memilih lebih dari 1 motif / treatment
                </div>
              </div>

              {/* Service Filter & Search */}
              <div className="space-y-3 mb-4">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-[#B59BA6] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Cari motif kuku dataset (contoh: Chrome, Cat Eye, Bunga, Abstrak, Putih)..."
                    value={serviceSearch}
                    onChange={(e) => setServiceSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-[#FFF0F4] border border-[#FCE2E8] rounded-full text-xs text-[#2D1F24] focus:outline-hidden focus:border-[#FF5376] focus:bg-white transition-all"
                  />
                </div>

                {/* Category Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setServiceCategory(cat)}
                      className={`px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                        serviceCategory === cat
                          ? 'bg-[#FF5376] text-white shadow-2xs'
                          : 'bg-[#FFF0F4] text-[#8C727D] hover:text-[#2D1F24] border border-[#FCE2E8]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Service Selection Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
                {filteredDesigns.map((design) => {
                  const isSelected = selectedServices.includes(design.id);
                  return (
                    <div
                      key={design.id}
                      onClick={() => isSelected ? onRemoveService(design.id) : onAddService(design.id)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 group relative ${
                        isSelected
                          ? 'bg-[#FFF0F4] border-[#FF5376] ring-1 ring-[#FF5376] shadow-xs'
                          : 'bg-white border-[#FCE2E8] hover:border-[#FF5376]/50 hover:bg-[#FFFBFD]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-14 h-14 rounded-xl overflow-hidden bg-[#FFF0F4] shrink-0 border border-[#FCE2E8] relative">
                          <img
                            src={design.image}
                            alt={design.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          {isSelected && (
                            <div className="absolute inset-0 bg-[#FF5376]/30 flex items-center justify-center">
                              <Check className="w-5 h-5 text-white stroke-[3]" />
                            </div>
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[9px] font-bold text-[#FF5376] bg-white px-1.5 py-0.5 rounded border border-[#FCD5DF]">
                              {design.category || 'Gaya'}
                            </span>
                            {design.tag && (
                              <span className="text-[9px] font-semibold text-[#8C727D] bg-white/80 px-1.5 py-0.5 rounded border border-[#FCE2E8]">
                                {design.tag}
                              </span>
                            )}
                          </div>
                          <h4 className="text-xs font-bold text-[#2D1F24] truncate mt-0.5">
                            {design.name}
                          </h4>
                          <span className="text-xs font-bold text-[#FF5376] block mt-0.5">
                            {formatRupiah(design.price)}
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-[#FF5376] text-white'
                            : 'border border-[#FCD5DF] text-[#B59BA6] group-hover:border-[#FF5376] group-hover:text-[#FF5376]'
                        }`}>
                          {isSelected ? (
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          ) : (
                            <Plus className="w-3.5 h-3.5" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredDesigns.length === 0 && (
                <div className="p-8 text-center bg-[#FFF0F4] rounded-2xl border border-dashed border-[#FCD5DF]">
                  <p className="text-xs font-bold text-[#2D1F24]">Tidak ada motif kuku yang cocok.</p>
                  <button
                    type="button"
                    onClick={() => { setServiceCategory('Semua'); setServiceSearch(''); }}
                    className="mt-2 text-xs font-bold text-[#FF5376] underline cursor-pointer"
                  >
                    Reset Filter
                  </button>
                </div>
              )}
            </div>

            {/* STEP 2: Jadwal, Jam & Preferensi Kuku */}
            <div className="bg-white border border-[#FCE2E8] rounded-3xl p-6 shadow-xs space-y-4">
              <div className="pb-3 border-b border-[#FCE2E8]">
                <span className="text-[10px] font-bold text-[#FF5376] uppercase tracking-wider bg-[#FFF0F4] px-2.5 py-0.5 rounded-full border border-[#FCD5DF]">
                  LANGKAH 2 DARI 3
                </span>
                <h3 className="text-base font-bold text-[#2D1F24] mt-1">
                  Pilih Tanggal, Jam &amp; Preferensi Kuku
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Tanggal Treatment */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#2D1F24] flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#FF5376]" />
                    Tanggal Kunjungan *
                  </label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#FFF0F4] border border-[#FCE2E8] rounded-full text-xs text-[#2D1F24] focus:outline-hidden focus:border-[#FF5376] focus:bg-white transition-all shadow-2xs"
                  />
                </div>

                {/* Pilih Stylist */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#2D1F24] flex items-center gap-1.5">
                    <Scissors className="w-3.5 h-3.5 text-[#FF5376]" />
                    Pilihan Stylist / Terapis
                  </label>
                  <select
                    value={formData.stylist}
                    onChange={(e) => setFormData({ ...formData, stylist: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#FFF0F4] border border-[#FCE2E8] rounded-full text-xs text-[#2D1F24] focus:outline-hidden focus:border-[#FF5376] focus:bg-white transition-all shadow-2xs"
                  >
                    {NAIL_STYLISTS.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Time Slots */}
              <div className="space-y-2 pt-2">
                <label className="text-xs font-semibold text-[#2D1F24] flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#FF5376]" />
                    Pilih Jam Kedatangan *
                  </span>
                  <span className="text-[10px] text-[#8C727D]">Waktu Indonesia Barat (WIB)</span>
                </label>

                <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                  {TIME_SLOTS.map((slot) => {
                    const isSelected = formData.time === slot.time;
                    return (
                      <button
                        type="button"
                        key={slot.time}
                        onClick={() => setFormData({ ...formData, time: slot.time })}
                        className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all cursor-pointer flex flex-col items-center justify-center ${
                          isSelected
                            ? 'bg-[#FF5376] text-white shadow-xs scale-105'
                            : 'bg-[#FFF0F4] text-[#8C727D] hover:bg-[#FFE5EC] hover:text-[#2D1F24] border border-[#FCE2E8]'
                        }`}
                      >
                        <span>{slot.time}</span>
                        <span className="text-[8px] opacity-75 font-normal">{slot.session}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Shape Preference */}
              <div className="space-y-2 pt-2">
                <label className="text-xs font-semibold text-[#2D1F24] block">
                  Preferensi Bentuk Kuku (Bisa disesuaikan di studio):
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {NAIL_SHAPES.map((shape) => (
                    <button
                      type="button"
                      key={shape.id}
                      onClick={() => setFormData({ ...formData, nailShape: shape.id })}
                      className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                        formData.nailShape === shape.id
                          ? 'bg-[#FFF0F4] border-[#FF5376] ring-1 ring-[#FF5376]'
                          : 'bg-white border-[#FCE2E8] hover:bg-[#FFFBFD]'
                      }`}
                    >
                      <span className="text-[11px] font-bold text-[#2D1F24] block truncate">{shape.name}</span>
                      <span className="text-[9px] text-[#8C727D] block truncate">{shape.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* STEP 3: Identitas Pelanggan & Catatan */}
            <div className="bg-white border border-[#FCE2E8] rounded-3xl p-6 shadow-xs space-y-4">
              <div className="pb-3 border-b border-[#FCE2E8]">
                <span className="text-[10px] font-bold text-[#FF5376] uppercase tracking-wider bg-[#FFF0F4] px-2.5 py-0.5 rounded-full border border-[#FCD5DF]">
                  LANGKAH 3 DARI 3
                </span>
                <h3 className="text-base font-bold text-[#2D1F24] mt-1">
                  Data Pemesan &amp; Catatan Khusus
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#2D1F24] flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#FF5376]" />
                    Nama Lengkap *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Jessica Anggraini"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#FFF0F4] border border-[#FCE2E8] rounded-full text-xs text-[#2D1F24] focus:outline-hidden focus:border-[#FF5376] focus:bg-white transition-all shadow-2xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#2D1F24] flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-[#FF5376]" />
                    Nomor WhatsApp *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="0812-3456-7890"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#FFF0F4] border border-[#FCE2E8] rounded-full text-xs text-[#2D1F24] focus:outline-hidden focus:border-[#FF5376] focus:bg-white transition-all shadow-2xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#2D1F24] flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#FF5376]" />
                  Email Konfirmasi *
                </label>
                <input
                  type="email"
                  required
                  placeholder="jessica@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[#FFF0F4] border border-[#FCE2E8] rounded-full text-xs text-[#2D1F24] focus:outline-hidden focus:border-[#FF5376] focus:bg-white transition-all shadow-2xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#2D1F24]">
                  Catatan Khusus (Opsional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Contoh: request kuku pendek, atau ada gel lama yang perlu dibersihkan lebih dulu..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[#FFF0F4] border border-[#FCE2E8] rounded-2xl text-xs text-[#2D1F24] focus:outline-hidden focus:border-[#FF5376] focus:bg-white transition-all resize-none shadow-2xs"
                />
              </div>
            </div>
          </div>

          {/* Side 5 Columns: Sticky Order Summary & Apriori Recommendations */}
          <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-24">
            {/* Basket / Order Summary Card */}
            <div className="bg-white border border-[#FCD5DF] rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#FCE2E8]">
                <div>
                  <h3 className="font-bold text-sm text-[#2D1F24] flex items-center gap-2">
                    <span>Ringkasan Reservasi</span>
                    <span className="w-5 h-5 rounded-full bg-[#FF5376] text-white text-[10px] font-bold flex items-center justify-center">
                      {selectedServices.length}
                    </span>
                  </h3>
                  <span className="text-[10px] text-[#8C727D]">Estimasi durasi: ~{estimatedDuration} Menit</span>
                </div>

                {selectedServices.length > 0 && (
                  <button
                    type="button"
                    onClick={onClearServices}
                    className="text-[10px] font-bold text-[#8C727D] hover:text-red-500 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Hapus Semua</span>
                  </button>
                )}
              </div>

              {/* Selected List */}
              {selectedServices.length === 0 ? (
                <div className="p-6 bg-[#FFF0F4] rounded-2xl text-center border border-dashed border-[#FCD5DF] mb-4">
                  <Heart className="w-7 h-7 text-[#FF5376]/50 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-[#2D1F24]">Belum Ada Layanan Dipilih</p>
                  <p className="text-[10px] text-[#8C727D] mt-0.5">
                    Pilih minimal satu motif kuku di Langkah 1 untuk melanjutkan.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 mb-4 max-h-56 overflow-y-auto pr-1">
                  {selectedServices.map((serviceId) => {
                    const design = designs.find(d => d.id === serviceId);
                    return (
                      <div
                        key={serviceId}
                        className="p-2.5 bg-[#FFF0F4] border border-[#FCE2E8] rounded-2xl flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {design?.image && (
                            <img
                              src={design.image}
                              alt={design.name}
                              referrerPolicy="no-referrer"
                              className="w-10 h-10 rounded-xl object-cover shrink-0 border border-[#FCE2E8]"
                            />
                          )}
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-[#2D1F24] truncate">
                              {design ? design.name : serviceId.replace(/_/g, ' ')}
                            </h4>
                            <span className="text-[10px] font-bold text-[#FF5376]">
                              {design ? formatRupiah(design.price) : '-'}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => onRemoveService(serviceId)}
                          className="p-1.5 text-[#8C727D] hover:text-red-500 hover:bg-white rounded-full transition-colors cursor-pointer shrink-0"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Schedule Preview Pill */}
              {formData.date && formData.time && (
                <div className="p-3 bg-[#FFF8FA] rounded-2xl border border-[#FCD5DF] mb-4 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-[#8C727D]">Tanggal:</span>
                    <span className="font-bold text-[#2D1F24]">{formData.date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8C727D]">Waktu:</span>
                    <span className="font-bold text-[#FF5376]">{formData.time} WIB</span>
                  </div>
                </div>
              )}

              {/* Total Calculation */}
              <div className="pt-3 border-t border-[#FCE2E8] space-y-2">
                <div className="flex justify-between text-xs text-[#8C727D]">
                  <span>Subtotal Perawatan</span>
                  <span>{formatRupiah(totalEstimate)}</span>
                </div>
                <div className="flex justify-between text-xs text-[#8C727D]">
                  <span>Konsultasi &amp; Sterilisasi</span>
                  <span className="text-emerald-600 font-bold">GRATIS</span>
                </div>
                <div className="flex justify-between text-base font-bold text-[#2D1F24] pt-2 border-t border-[#FCE2E8]">
                  <span>Estimasi Biaya Total</span>
                  <span className="text-[#FF5376]">{formatRupiah(totalEstimate)}</span>
                </div>
              </div>

              {/* Big Submit Button */}
              <div className="mt-5">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading || selectedServices.length === 0}
                  className="w-full py-4 px-6 bg-[#FF5376] hover:bg-[#FF3E66] text-white text-xs font-bold uppercase tracking-widest rounded-full transition-all duration-300 shadow-md shadow-pink-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span>Memproses Reservasi Anda...</span>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Konfirmasi Booking ({formatRupiah(totalEstimate)})</span>
                    </>
                  )}
                </button>
              </div>

              {/* Quality Guarantee Badges */}
              <div className="mt-4 pt-4 border-t border-[#FCE2E8] space-y-2 text-[11px] text-[#8C727D]">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Garansi Ketahanan Gel &amp; Retouch 7 Hari</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#FF5376] shrink-0" />
                  <span>Alat Higienis Steril Bersertifikat Medis</span>
                </div>
              </div>
            </div>

            {/* Smart Apriori Upsell Widget */}
            {upsellSuggestion && (
              <div className="bg-gradient-to-br from-[#FFF0F4] to-[#FFE4EC] border border-[#FCD5DF] rounded-3xl p-5 shadow-xs">
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#FF5376] animate-pulse" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF5376]">
                      {matchedRule ? 'Rekomendasi Algoritma Apriori' : 'Sering Dipesan Bersama (Rekomendasi AI)'}
                    </span>
                  </div>
                  {matchedRule ? (
                    <span className="text-[9px] bg-[#FF5376] text-white font-bold px-2 py-0.5 rounded-full shadow-2xs">
                      {matchedRule.confidence}% Cocok (Lift {matchedRule.lift}x)
                    </span>
                  ) : (
                    <span className="text-[9px] bg-white text-[#FF5376] font-bold px-2 py-0.5 rounded-full border border-[#FCD5DF]">
                      Motif Populer
                    </span>
                  )}
                </div>

                {matchedRule && (
                  <p className="text-[10px] text-[#8C727D] mb-2.5 bg-white/70 backdrop-blur-xs p-2 rounded-xl border border-[#FCE2E8] leading-tight">
                    💡 Pelanggan yang memesan <strong className="text-[#2D1F24]">{matchedRule.antecedent}</strong> sering menambah <strong className="text-[#FF5376]">{upsellSuggestion.name}</strong>.
                  </p>
                )}

                <div className="flex items-center gap-3">
                  <img
                    src={upsellSuggestion.image}
                    alt={upsellSuggestion.name}
                    referrerPolicy="no-referrer"
                    className="w-14 h-14 rounded-2xl object-cover border border-white shrink-0 shadow-2xs"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-[#2D1F24] truncate">
                      {upsellSuggestion.name}
                    </h4>
                    <p className="text-[10px] text-[#8C727D] line-clamp-1">
                      {upsellSuggestion.styleSubtitle || 'Motif kuku terfavorit'}
                    </p>
                    <span className="text-xs font-bold text-[#FF5376]">
                      {formatRupiah(upsellSuggestion.price)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onAddService(upsellSuggestion.id)}
                    className="px-3.5 py-2 bg-[#FF5376] hover:bg-[#FF3E66] text-white text-xs font-bold rounded-full transition-all shadow-xs flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
