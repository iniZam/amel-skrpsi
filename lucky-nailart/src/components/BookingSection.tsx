import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Calendar, Clock, Phone, User, Mail, Sparkles, Check, Trash2, Heart, Plus } from 'lucide-react';
import { NailDesign, Booking, RecommendationData } from '../types';

interface BookingSectionProps {
  designs: NailDesign[];
  recommendations: RecommendationData | null;
  selectedServices: string[];
  onAddService: (serviceId: string) => void;
  onRemoveService: (serviceId: string) => void;
  onClearServices: () => void;
  onBookingSuccess: (booking: Booking) => void;
}

const TIME_SLOTS = [
  "09:00", "10:30", "12:00", "13:30", "15:00", "16:30", "18:00", "19:30"
];

export default function BookingSection({
  designs,
  recommendations,
  selectedServices,
  onAddService,
  onRemoveService,
  onClearServices,
  onBookingSuccess
}: BookingSectionProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    date: '',
    time: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successBooking, setSuccessBooking] = useState<Booking | null>(null);
  const [upsellSuggestion, setUpsellSuggestion] = useState<NailDesign | null>(null);

  // Auto-fill tomorrow's date by default
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setFormData(prev => ({
      ...prev,
      date: tomorrow.toISOString().split('T')[0]
    }));
  }, []);

  // Compute total estimate
  const totalEstimate = selectedServices.reduce((acc, id) => {
    const design = designs.find(d => d.id === id);
    return acc + (design ? design.price : 0);
  }, 0);

  // Dynamic Suggestion Engine (Client-side Apriori lookup)
  useEffect(() => {
    if (selectedServices.length === 0 || !recommendations || !recommendations.recommendations) {
      setUpsellSuggestion(null);
      return;
    }

    const activeRules = recommendations.recommendations;
    let bestMatch: string | null = null;

    for (const rule of activeRules) {
      const antItems = rule.antecedent.split(', ').map(i => i.trim().replace(/\s+/g, '_'));
      const consItems = rule.consequent.split(', ').map(i => i.trim().replace(/\s+/g, '_'));

      const antecedentMatched = antItems.every(item => selectedServices.includes(item));
      const consequentUnselected = consItems.filter(item => !selectedServices.includes(item));

      if (antecedentMatched && consequentUnselected.length > 0) {
        bestMatch = consequentUnselected[0];
        break;
      }
    }

    if (bestMatch) {
      const designMatch = designs.find(d => d.id === bestMatch);
      if (designMatch) {
        setUpsellSuggestion(designMatch);
        return;
      }
    }

    const unselected = designs.filter(d => !selectedServices.includes(d.id));
    if (unselected.length > 0) {
      setUpsellSuggestion(unselected[0]);
    } else {
      setUpsellSuggestion(null);
    }
  }, [selectedServices, recommendations, designs]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (selectedServices.length === 0) {
      setError("Silakan pilih minimal satu motif desain kuku dari galeri atau daftar di bawah.");
      return;
    }

    if (!formData.time) {
      setError("Silakan pilih jam reservasi yang tersedia.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          services: selectedServices
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal membuat reservasi.");
      }

      setSuccessBooking(data.booking);
      onBookingSuccess(data.booking);
      onClearServices();
      setFormData({
        name: '',
        email: '',
        phone: '',
        date: '',
        time: ''
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(value);
  };

  if (successBooking) {
    return (
      <div className="py-12 px-4 max-w-2xl mx-auto text-left" id="booking">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white border-2 border-[#FF5376] rounded-3xl p-8 text-center shadow-lg shadow-pink-100"
        >
          <div className="w-16 h-16 bg-[#FFF0F4] rounded-full flex items-center justify-center text-[#FF5376] mx-auto mb-5 border border-[#FCD5DF]">
            <Check className="w-8 h-8 font-bold" />
          </div>
          <span className="text-xs font-bold tracking-wider text-[#FF5376] bg-[#FFF0F4] px-4 py-1.5 rounded-full border border-[#FCD5DF] uppercase">
            PEMESANAN BERHASIL
          </span>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#2D1F24] mt-3 tracking-tight">
            Jadwal Anda Terdaftar! ✨
          </h2>
          <p className="text-[#8C727D] text-xs sm:text-sm mt-2 leading-relaxed">
            Terima kasih telah memilih Nailove. Silakan simpan nomor pemesanan di bawah ini saat datang ke studio.
          </p>

          <div className="my-6 p-5 bg-[#FFF0F4] border border-[#FCE2E8] rounded-2xl text-left space-y-2.5 text-xs text-[#2D1F24]">
            <div className="flex justify-between border-b border-[#FCE2E8] pb-2">
              <span className="text-[#8C727D]">No. Pemesanan</span>
              <span className="font-mono font-bold text-[#FF5376]">{successBooking.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8C727D]">Nama Pelanggan</span>
              <span className="font-bold">{successBooking.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8C727D]">Tanggal Kunjungan</span>
              <span className="font-bold">{successBooking.date}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8C727D]">Jam Reservasi</span>
              <span className="font-bold">{successBooking.time} WIB</span>
            </div>
            <div className="flex justify-between items-start pt-2 border-t border-[#FCE2E8]">
              <span className="text-[#8C727D]">Desain Dipilih</span>
              <div className="flex flex-col items-end gap-1">
                {successBooking.services.map((svc, i) => (
                  <span key={i} className="text-xs font-bold text-[#FF5376]">
                    {svc.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={() => setSuccessBooking(null)}
            className="w-full py-3.5 bg-[#FF5376] hover:bg-[#FF3E66] text-white font-bold text-xs uppercase tracking-widest rounded-full transition-all shadow-md shadow-pink-200 cursor-pointer"
          >
            Buat Reservasi Baru
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <section className="py-12 px-4 max-w-7xl mx-auto text-left" id="booking">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FFF0F4] border border-[#FCD5DF] rounded-full text-[#FF5376] text-[10px] font-bold uppercase mb-2">
          <Sparkles className="w-3 h-3" />
          <span>Kenyamanan Reservasi</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#2D1F24] tracking-tight">
          Booking Jadwal Cantik Anda
        </h2>
        <p className="text-[#8C727D] mt-1.5 max-w-lg mx-auto text-xs sm:text-sm leading-relaxed">
          Tentukan waktu kunjungan Anda, pilih motif favorit, dan tim profesional kami siap merawat kuku Anda.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Formulir Input Booking (7 Columns) */}
        <div className="lg:col-span-7 bg-white border border-[#FCE2E8] rounded-3xl p-6 sm:p-8 shadow-xs">
          <h3 className="text-base sm:text-lg font-bold text-[#2D1F24] tracking-tight mb-5 pb-3 border-b border-[#FCE2E8] flex items-center justify-between">
            <span>Detail Reservasi</span>
            <span className="text-xs font-normal text-[#8C727D]">Langkah 1 dari 2</span>
          </h3>

          {error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs flex items-center gap-2">
              <span>⚠️ {error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#2D1F24] flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#FF5376]" />
                  Nama Lengkap
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
                  Nomor WhatsApp
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
                Email Konfirmasi
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#2D1F24] flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#FF5376]" />
                  Tanggal Treatment
                </label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[#FFF0F4] border border-[#FCE2E8] rounded-full text-xs text-[#2D1F24] focus:outline-hidden focus:border-[#FF5376] focus:bg-white transition-all shadow-2xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#2D1F24] flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#FF5376]" />
                  Pilih Jam Kunjungan
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {TIME_SLOTS.map((slot) => {
                    const isSelected = formData.time === slot;
                    return (
                      <button
                        type="button"
                        key={slot}
                        onClick={() => setFormData({ ...formData, time: slot })}
                        className={`py-2 text-[11px] font-bold rounded-xl transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#FF5376] text-white shadow-xs'
                            : 'bg-[#FFF0F4] text-[#8C727D] hover:bg-[#FFE4EC] hover:text-[#2D1F24] border border-[#FCE2E8]'
                        }`}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-6 bg-[#FF5376] hover:bg-[#FF3E66] text-white text-xs font-bold uppercase tracking-widest rounded-full transition-all duration-300 shadow-md shadow-pink-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <span>Memproses Reservasi...</span>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Konfirmasi Booking Sekarang ({formatRupiah(totalEstimate)})</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Selected Services & Apriori Upsell (5 Columns) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Selected Services Basket */}
          <div className="bg-white border border-[#FCE2E8] rounded-3xl p-6 shadow-xs">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#FCE2E8]">
              <h3 className="font-bold text-sm text-[#2D1F24] flex items-center gap-2">
                <span>Rencana Perawatan</span>
                <span className="w-5 h-5 rounded-full bg-[#FFF0F4] text-[#FF5376] text-[10px] font-bold flex items-center justify-center border border-[#FCD5DF]">
                  {selectedServices.length}
                </span>
              </h3>
              {selectedServices.length > 0 && (
                <button
                  onClick={onClearServices}
                  className="text-[10px] font-bold text-[#8C727D] hover:text-red-500 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  Reset
                </button>
              )}
            </div>

            {selectedServices.length === 0 ? (
              <div className="p-6 bg-[#FFF0F4] rounded-2xl text-center border border-dashed border-[#FCD5DF]">
                <Heart className="w-6 h-6 text-[#FF5376]/50 mx-auto mb-2" />
                <p className="text-xs font-semibold text-[#2D1F24]">Belum ada motif yang dipilih</p>
                <p className="text-[10px] text-[#8C727D] mt-0.5">
                  Klik "Pilih Layanan" pada galeri di atas untuk menambahkan motif kuku.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 mb-4 max-h-56 overflow-y-auto pr-1">
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
                          <span className="text-[10px] font-semibold text-[#FF5376]">
                            {design ? formatRupiah(design.price) : '-'}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => onRemoveService(serviceId)}
                        className="p-1 text-[#8C727D] hover:text-red-500 hover:bg-white rounded-full transition-colors cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Total Calculation */}
            <div className="pt-3 border-t border-[#FCE2E8] flex items-center justify-between">
              <span className="text-xs text-[#8C727D] font-medium">Estimasi Biaya</span>
              <span className="text-base font-bold text-[#FF5376]">{formatRupiah(totalEstimate)}</span>
            </div>
          </div>

          {/* Intelligent Apriori Upsell Suggestion */}
          {upsellSuggestion && (
            <div className="bg-gradient-to-br from-[#FFF0F4] to-[#FFE4EC] border border-[#FCD5DF] rounded-3xl p-5 shadow-xs">
              <div className="flex items-center gap-2 mb-2.5">
                <Sparkles className="w-4 h-4 text-[#FF5376] animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF5376]">
                  Sering Dipesan Bersama (Apriori Rule)
                </span>
              </div>

              <div className="flex items-center gap-3">
                <img
                  src={upsellSuggestion.image}
                  alt={upsellSuggestion.name}
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded-2xl object-cover border border-white shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-[#2D1F24] truncate">
                    {upsellSuggestion.name}
                  </h4>
                  <p className="text-[10px] text-[#8C727D]">
                    {formatRupiah(upsellSuggestion.price)}
                  </p>
                </div>
                <button
                  onClick={() => onAddService(upsellSuggestion.id)}
                  className="px-3 py-1.5 bg-[#FF5376] hover:bg-[#FF3E66] text-white text-[10px] font-bold rounded-full transition-all shadow-xs flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <Plus className="w-3 h-3" />
                  <span>Tambah</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
