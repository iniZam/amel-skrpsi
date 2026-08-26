import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Calendar, Clock, Phone, User, Mail, Sparkles, Check, Trash2 } from 'lucide-react';
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
  // If user has selected some items, look through association rules for matches!
  useEffect(() => {
    if (selectedServices.length === 0 || !recommendations || !recommendations.recommendations) {
      setUpsellSuggestion(null);
      return;
    }

    // Try to find a rule where the antecedent is in selectedServices and consequent is NOT yet selected
    const activeRules = recommendations.recommendations;
    let bestMatch: string | null = null;

    for (const rule of activeRules) {
      // Clean rule strings
      const antItems = rule.antecedent.split(', ').map(i => i.trim().replace(/\s+/g, '_'));
      const consItems = rule.consequent.split(', ').map(i => i.trim().replace(/\s+/g, '_'));

      // Check if all items in antecedent are currently selected by user
      const antecedentMatched = antItems.every(item => selectedServices.includes(item));
      
      // Consequent items must NOT be already selected
      const consequentUnselected = consItems.filter(item => !selectedServices.includes(item));

      if (antecedentMatched && consequentUnselected.length > 0) {
        bestMatch = consequentUnselected[0]; // recommend the first unselected item
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

    // Fallback: suggest a general design that isn't selected yet
    const unselected = designs.filter(d => !selectedServices.includes(d.id));
    if (unselected.length > 0) {
      setUpsellSuggestion(unselected[0]);
    } else {
      setUpsellSuggestion(null);
    }
  }, [selectedServices, recommendations, designs]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTimeSelect = (time: string) => {
    setFormData(prev => ({ ...prev, time }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (selectedServices.length === 0) {
      setError("Silakan pilih minimal 1 desain kuku untuk dipesan.");
      return;
    }

    if (!formData.time) {
      setError("Silakan pilih jam kedatangan Anda.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/public/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          services: selectedServices
        })
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Gagal membuat pemesanan.");
      }

      setSuccessBooking(result.booking);
      onBookingSuccess(result.booking);
      onClearServices();
      setFormData({
        name: '',
        email: '',
        phone: '',
        date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        time: ''
      });
    } catch (err: any) {
      setError(err.message || "Koneksi terputus. Silakan coba lagi.");
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
      <div className="py-16 px-4 max-w-2xl mx-auto text-left" id="booking">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white border-2 border-art-gold rounded-none p-8 text-center"
        >
          <div className="w-16 h-16 bg-art-light rounded-full flex items-center justify-center text-art-gold mx-auto mb-6 border border-art-border">
            <Check className="w-8 h-8 font-bold" />
          </div>
          <span className="text-xs font-mono font-bold tracking-widest text-art-gold bg-art-light px-4 py-1.5 border border-art-border uppercase">PEMESANAN BERHASIL</span>
          <h2 className="text-3xl font-serif text-art-text mt-4 uppercase tracking-tight">Jadwal Anda Terdaftar!</h2>
          <p className="text-art-muted text-sm mt-2 font-normal leading-relaxed">
            Terima kasih telah memilih Lucky Nailart. Silakan simpan nomor pemesanan di bawah ini saat datang ke studio kami.
          </p>

          <div className="my-6 p-5 bg-art-light border border-art-border rounded-none text-left space-y-3 text-xs uppercase font-medium text-art-text">
            <div className="flex justify-between border-b border-art-border pb-2.5">
              <span className="text-art-stone text-[10px] font-mono tracking-wider">No. Pemesanan</span>
              <span className="font-mono font-bold text-art-text">{successBooking.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-art-stone text-[10px] font-mono tracking-wider">Nama Pelanggan</span>
              <span className="font-bold text-art-text">{successBooking.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-art-stone text-[10px] font-mono tracking-wider">Tanggal Kunjungan</span>
              <span className="font-bold text-art-text">{successBooking.date}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-art-stone text-[10px] font-mono tracking-wider">Jam Reservasi</span>
              <span className="font-bold text-art-text">{successBooking.time} WIB</span>
            </div>
            <div className="flex justify-between items-start pt-2.5 border-t border-art-border">
              <span className="text-art-stone text-[10px] font-mono tracking-wider">Desain Dipilih</span>
              <div className="flex flex-col items-end gap-1">
                {successBooking.services.map((svc, i) => (
                  <span key={i} className="text-xs text-art-text font-bold">
                    {svc.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={() => setSuccessBooking(null)}
            className="w-full py-4 bg-art-dark hover:bg-art-gold text-white font-bold text-xs uppercase tracking-widest rounded-none transition-all cursor-pointer"
          >
            Buat Reservasi Baru
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <section className="py-16 px-4 bg-[#FDFBF9] border-t border-art-border text-left" id="booking">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-art-stone font-mono text-xs tracking-[0.25em] uppercase block">Kenyamanan Reservasi</span>
          <h2 className="text-4xl font-serif mt-3 text-art-text tracking-tight uppercase">Booking Jadwal Cantik Anda</h2>
          <div className="w-16 h-[1px] bg-art-gold mx-auto my-4" />
          <p className="text-art-muted mt-2 max-w-xl mx-auto text-sm leading-relaxed">
            Isi formulir pemesanan, tentukan waktu kunjungan Anda, dan tim kami siap menyulap jari-jemari Anda menjadi karya seni kuku yang megah.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Formulir Input Booking (8 Columns) */}
          <div className="lg:col-span-7 bg-white border border-art-border rounded-none p-6 lg:p-8">
            <h3 className="text-xl font-serif text-art-text uppercase tracking-tight mb-6 pb-3 border-b border-art-border">
              Detail Reservasi
            </h3>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200/50 text-red-800 rounded-none text-xs flex items-center gap-2">
                <span>⚠️ {error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Nama & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-art-text uppercase tracking-widest block">Nama Lengkap</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-art-stone" />
                    <input
                      type="text"
                      name="name"
                      required
                      placeholder="Contoh: Linda Wardani"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 border border-art-border rounded-none text-xs focus:outline-hidden focus:border-art-gold bg-white transition-colors text-art-text placeholder:text-art-stone/60 font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-art-text uppercase tracking-widest block">Email Aktif</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-art-stone" />
                    <input
                      type="email"
                      name="email"
                      required
                      placeholder="linda@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 border border-art-border rounded-none text-xs focus:outline-hidden focus:border-art-gold bg-white transition-colors text-art-text placeholder:text-art-stone/60 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* No Handphone & Tanggal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-art-text uppercase tracking-widest block">Nomor WhatsApp / HP</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-art-stone" />
                    <input
                      type="text"
                      name="phone"
                      required
                      placeholder="08xxxxxxxxxx"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 border border-art-border rounded-none text-xs focus:outline-hidden focus:border-art-gold bg-white transition-colors text-art-text placeholder:text-art-stone/60 font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-art-text uppercase tracking-widest block">Tanggal Kunjungan</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-art-stone" />
                    <input
                      type="date"
                      name="date"
                      required
                      value={formData.date}
                      onChange={handleChange}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full pl-10 pr-4 py-3 border border-art-border rounded-none text-xs focus:outline-hidden focus:border-art-gold bg-white transition-colors text-art-text font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Jam Kunjungan */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-art-text uppercase tracking-widest flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-art-stone" />
                  Pilih Jam Kedatangan
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {TIME_SLOTS.map((time) => (
                    <button
                      key={time}
                      type="button"
                      id={`time-slot-${time}`}
                      onClick={() => handleTimeSelect(time)}
                      className={`py-2.5 text-center text-xs font-bold rounded-none border transition-all duration-200 cursor-pointer ${
                        formData.time === time
                          ? 'bg-art-gold border-art-gold text-white'
                          : 'bg-white border-art-border hover:border-art-stone text-art-text'
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-6 bg-art-dark hover:bg-art-gold text-white font-bold text-xs uppercase tracking-widest rounded-none transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer disabled:bg-art-stone"
              >
                {loading ? "Mempersiapkan Rencana Anda..." : `Konfirmasi Jadwal Booking — ${formatRupiah(totalEstimate)}`}
              </button>
            </form>
          </div>

          {/* Samping Rencana Perawatan (4 Columns) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Selected Services Card */}
            <div className="bg-white border border-art-border rounded-none p-6">
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-art-border">
                <h4 className="font-serif text-lg text-art-text uppercase tracking-tight">Rencana Perawatan</h4>
                {selectedServices.length > 0 && (
                  <button
                    onClick={onClearServices}
                    className="text-[10px] uppercase tracking-widest font-bold text-red-700 hover:text-red-800 flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" /> Bersihkan
                  </button>
                )}
              </div>

              {selectedServices.length > 0 ? (
                <div className="space-y-4 mb-6">
                  {selectedServices.map(id => {
                    const design = designs.find(d => d.id === id);
                    if (!design) return null;
                    return (
                      <div key={id} className="flex items-center gap-3 justify-between">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={design.image}
                            alt={design.name}
                            referrerPolicy="no-referrer"
                            className="w-10 h-10 object-cover rounded-none border border-art-border"
                          />
                          <div>
                            <span className="text-xs font-bold text-art-text block uppercase leading-tight">{design.name}</span>
                            <span className="text-[9px] text-art-stone font-mono tracking-wider uppercase">Polesan Premium</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-art-text">{formatRupiah(design.price)}</span>
                          <button
                            type="button"
                            onClick={() => onRemoveService(id)}
                            className="text-art-stone hover:text-red-700 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  <div className="pt-4 border-t border-art-border flex justify-between items-center text-sm font-semibold text-art-text">
                    <span>Estimasi Total</span>
                    <span className="text-lg text-art-gold font-serif font-bold">{formatRupiah(totalEstimate)}</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-art-stone space-y-2">
                  <p className="text-xs">Rencana Anda masih kosong.</p>
                  <p className="text-[10px] text-art-stone max-w-xs mx-auto">
                    Silakan klik tombol <strong>Pilih Layanan</strong> pada galeri kuku di atas untuk menambahkan desain kuku favorit Anda.
                  </p>
                </div>
              )}
            </div>

            {/* Smart Cross-Sell Recommendation Card (Only displays when something is selected) */}
            {upsellSuggestion && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-art-light border border-art-gold rounded-none p-6 relative overflow-hidden"
              >
                <div className="flex items-center gap-1.5 text-[10px] font-mono tracking-widest uppercase text-art-gold font-bold mb-3">
                  <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                  <span>Sempurna Bersama Ini (Apriori AI)</span>
                </div>

                <div className="flex items-start gap-3.5 text-left">
                  <img
                    src={upsellSuggestion.image}
                    alt={upsellSuggestion.name}
                    referrerPolicy="no-referrer"
                    className="w-16 h-16 object-cover rounded-none border border-art-border"
                  />
                  <div className="flex-1 min-w-0">
                    <h5 className="text-sm font-bold text-art-text uppercase tracking-tight leading-tight mb-0.5">{upsellSuggestion.name}</h5>
                    <span className="text-xs font-bold text-art-gold font-mono block mb-2">
                      {formatRupiah(upsellSuggestion.price)}
                    </span>
                    <p className="text-[10px] text-art-muted leading-relaxed mb-3">
                      Pelanggan yang memesan desain pilihan Anda juga sangat sering menambahkan desain ini secara bersamaan!
                    </p>
                    <button
                      type="button"
                      onClick={() => onAddService(upsellSuggestion.id)}
                      className="py-2 px-4 bg-art-dark text-white text-[10px] font-bold uppercase tracking-widest rounded-none hover:bg-art-gold transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Check className="w-3 h-3" /> Tambah Rencana
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
