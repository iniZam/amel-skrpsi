import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Calendar, Grid, Shield, LogOut, ArrowRight, CheckCircle } from 'lucide-react';
import { NailDesign, RecommendationData } from './types';
import GallerySection from './components/GallerySection';
import BookingSection from './components/BookingSection';
import AdminSection from './components/AdminSection';

export default function App() {
  const [designs, setDesigns] = useState<NailDesign[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendationData | null>(null);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Load gallery and recommendations
  const loadPublicData = async () => {
    try {
      const [galRes, recRes] = await Promise.all([
        fetch('/api/public/gallery'),
        fetch('/api/public/recommendations')
      ]);
      if (galRes.ok) {
        const galData = await galRes.json();
        setDesigns(galData);
      }
      if (recRes.ok) {
        const recData = await recRes.json();
        setRecommendations(recData);
      }
    } catch (err) {
      console.error("Gagal memuat data dari server:", err);
    }
  };

  useEffect(() => {
    loadPublicData();

    // Check if admin token exists
    const token = localStorage.getItem('lucky_admin_token');
    if (token) {
      setIsAdmin(true);
    }
  }, []);

  const handleSelectService = (id: string) => {
    setSelectedServices(prev => {
      if (prev.includes(id)) {
        return prev; // already selected
      }
      return [...prev, id];
    });

    // Scroll smoothly to booking form
    const bookingElement = document.getElementById('booking');
    if (bookingElement) {
      bookingElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleRemoveService = (id: string) => {
    setSelectedServices(prev => prev.filter(x => x !== id));
  };

  const handleClearServices = () => {
    setSelectedServices([]);
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUsername, password: loginPassword })
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Gagal masuk.");
      }

      localStorage.setItem('lucky_admin_token', result.token);
      setIsAdmin(true);
      setShowLoginModal(false);
      setLoginUsername('');
      setLoginPassword('');
    } catch (err: any) {
      setLoginError(err.message || "Gagal masuk.");
    }
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('lucky_admin_token');
    setIsAdmin(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-art-bg text-art-text selection:bg-art-gold/20 selection:text-art-text">
      {/* Premium Header / Navigation Bar */}
      <header className="sticky top-0 z-40 bg-art-bg/90 backdrop-blur-md border-b border-art-border h-20 flex items-center">
        <div className="max-w-7xl mx-auto w-full px-4 flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-art-gold rounded-full flex items-center justify-center text-white font-serif text-xl">
              L
            </div>
            <div>
              <span className="font-serif text-lg font-bold tracking-tight text-art-text block leading-tight uppercase">Lucky Nailart</span>
              <span className="text-[9px] font-mono tracking-widest text-art-stone block uppercase">Artistic Studio</span>
            </div>
          </div>

          {/* Nav items */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold uppercase tracking-widest text-art-stone">
            <a href="#hero" className="hover:text-art-text pb-1 transition-colors border-b border-transparent hover:border-art-text">Utama</a>
            <a href="#gallery" className="hover:text-art-text pb-1 transition-colors border-b border-transparent hover:border-art-text">Galeri Kuku</a>
            <a href="#booking" className="hover:text-art-text pb-1 transition-colors border-b border-transparent hover:border-art-text">Pemesanan</a>
          </nav>

          {/* Action Button */}
          <div className="flex items-center gap-3">
            {isAdmin ? (
              <button
                onClick={handleAdminLogout}
                className="py-2.5 px-4 bg-red-50 text-red-700 border border-red-200 text-xs font-bold uppercase tracking-wider rounded-none hover:bg-red-100 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                Logout
              </button>
            ) : (
              <button
                id="btn-admin-panel"
                onClick={() => {
                  if (isAdmin) {
                    setIsAdmin(false);
                  } else {
                    setShowLoginModal(true);
                  }
                }}
                className="py-2.5 px-4 border border-art-border text-art-text text-[10px] font-bold uppercase tracking-widest hover:bg-art-light transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Shield className="w-3.5 h-3.5" />
                Admin Panel
              </button>
            )}

            <a
              href="#booking"
              className="py-2.5 px-5 bg-art-dark hover:bg-art-gold text-white text-[10px] font-bold uppercase tracking-widest transition-all hidden sm:inline-block"
            >
              Book Now
            </a>
          </div>
        </div>
      </header>

      {/* Main View Port */}
      <main className="flex-1">
        {isAdmin ? (
          /* Secure Admin Panel view */
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <AdminSection designs={designs} onLogout={handleAdminLogout} />
          </motion.div>
        ) : (
          /* Standard Customer View */
          <div>
            {/* Elegant Hero Banner */}
            <section className="relative min-h-[80vh] flex items-center justify-center px-4 overflow-hidden" id="hero">
              {/* Artistic Background blobs */}
              <div className="absolute top-1/4 left-1/10 w-96 h-96 bg-art-gold/5 rounded-full blur-3xl animate-pulse" />
              <div className="absolute bottom-1/4 right-1/10 w-96 h-96 bg-art-light/30 rounded-full blur-3xl" />

              <div className="max-w-4xl mx-auto text-center relative z-10 py-16">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7 }}
                  className="space-y-8"
                >
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold tracking-[0.2em] text-art-gold bg-art-light border border-art-border px-4 py-1.5 uppercase shadow-2xs">
                    <Sparkles className="w-3.5 h-3.5 animate-pulse text-art-gold" />
                    Premium Nail Artistry
                  </span>

                  <h1 className="text-5xl md:text-7xl font-serif text-art-text tracking-tight leading-tight">
                    Elevate<br className="sm:hidden" /> Your Style.<br />
                    <span className="italic font-normal text-art-gold font-serif">Lucky Nailart Studio</span>
                  </h1>

                  <p className="text-art-muted text-sm md:text-base max-w-2xl mx-auto font-normal leading-relaxed">
                    Every stroke is a masterpiece. Tailored designs curated by our intelligent preference engine. Hadirkan keindahan kuku mewah sesuai karakter Anda dengan presisi tinggi dan layanan super nyaman.
                  </p>

                  <div className="pt-6 flex flex-col sm:flex-row justify-center items-center gap-4">
                    <a
                      href="#booking"
                      className="w-full sm:w-auto py-4 px-8 bg-art-dark hover:bg-art-gold text-white font-bold text-xs tracking-widest uppercase transition-all duration-300 flex items-center justify-center gap-2"
                    >
                      <Calendar className="w-4 h-4" />
                      Book Appointment
                    </a>
                    <a
                      href="#gallery"
                      className="w-full sm:w-auto py-4 px-8 bg-white hover:bg-art-light text-art-text border border-art-border font-bold text-xs tracking-widest uppercase transition-all duration-300 flex items-center justify-center gap-2"
                    >
                      <Grid className="w-4 h-4" />
                      Jelajahi Galeri
                    </a>
                  </div>
                </motion.div>
              </div>

              {/* Little stats strip */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-3xl px-4 hidden md:block">
                <div className="bg-art-light border border-art-border p-5 grid grid-cols-3 gap-4 text-center">
                  <div>
                    <span className="text-[10px] text-art-stone font-mono tracking-widest uppercase block">BAHAN PREMIUM</span>
                    <span className="text-xs font-bold text-art-text block mt-1">100% Vegan &amp; Non-Toxic</span>
                  </div>
                  <div className="border-x border-art-border">
                    <span className="text-[10px] text-art-stone font-mono tracking-widest uppercase block">REKOMENDASI AI</span>
                    <span className="text-xs font-bold text-art-text block mt-1">Apriori Engine Pulse</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-art-stone font-mono tracking-widest uppercase block">GARANSI RETOUCH</span>
                    <span className="text-xs font-bold text-art-text block mt-1">3 Hari Bebas Cacat</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Gallery Section with Apriori recommendations */}
            <GallerySection
              designs={designs}
              recommendations={recommendations}
              onSelectService={handleSelectService}
            />

            {/* Booking form scheduler */}
            <BookingSection
              designs={designs}
              recommendations={recommendations}
              selectedServices={selectedServices}
              onAddService={handleSelectService}
              onRemoveService={handleRemoveService}
              onClearServices={handleClearServices}
              onBookingSuccess={loadPublicData}
            />
          </div>
        )}
      </main>

      {/* Luxury Footer */}
      <footer className="bg-art-dark text-art-stone py-12 px-4 border-t border-white/5 text-[11px]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 text-left">
          <div className="space-y-4">
            <span className="font-serif text-lg font-bold tracking-tight text-white block">Lucky Nailart Studio</span>
            <p className="leading-relaxed text-art-stone/80 font-light pr-4">
              Menghadirkan seni kecantikan jari kuku berstandar kelas dunia di Jakarta dengan presisi tinggi dan layanan super nyaman.
            </p>
          </div>
          <div>
            <span className="font-serif text-xs font-semibold text-white uppercase tracking-widest block mb-4">Jam Layanan Kami</span>
            <ul className="space-y-2 text-art-stone/80 font-light">
              <li>Senin - Jumat: 10.00 - 20.00 WIB</li>
              <li>Sabtu - Minggu: 09.00 - 21.00 WIB</li>
              <li>Hari Libur Nasional: Tutup</li>
            </ul>
          </div>
          <div>
            <span className="font-serif text-xs font-semibold text-white uppercase tracking-widest block mb-4">Lokasi Studio</span>
            <ul className="space-y-2 text-art-stone/80 font-light">
              <li>Ruko Kebayoran Baru, Blok C No. 12</li>
              <li>Jakarta Selatan, DKI Jakarta 12130</li>
              <li>Telp/WA: +62 812-3456-7890</li>
            </ul>
          </div>
          <div>
            <span className="font-serif text-xs font-semibold text-white uppercase tracking-widest block mb-4">Apriori Engine</span>
            <p className="leading-relaxed text-art-stone/80 font-light">
              Model kami didukung analisis pola relasi transaksi real-time. Sistem akan mendeteksi tren setiap ada 20 transaksi baru secara otomatis.
            </p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto pt-8 border-t border-white/10 text-center font-mono text-[9px] uppercase tracking-[0.3em] text-art-stone/60 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>© {new Date().getFullYear()} Lucky Nailart Studio — Jakarta, ID</div>
          <div>Handcrafted Nails • Data Driven Beauty</div>
        </div>
      </footer>

      {/* Admin Login Modal overlay */}
      <AnimatePresence>
        {showLoginModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLoginModal(false)}
              className="absolute inset-0 bg-art-dark/60 backdrop-blur-xs"
            />

            {/* Dialog Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-sm bg-art-bg border border-art-border rounded-none p-6 lg:p-8 shadow-2xl z-10 text-left"
            >
              <div className="text-center mb-6">
                <span className="text-[10px] font-mono tracking-widest text-art-stone uppercase">AKSES PENGELOLA</span>
                <h3 className="text-xl font-serif text-art-text font-bold mt-1">Masuk Dashboard Admin</h3>
                <p className="text-art-muted text-[10px] mt-1 leading-relaxed">
                  Masukkan identitas admin Anda. Hubungi supervisor jika lupa kata sandi. (Bawaan: admin / admin123)
                </p>
              </div>

              {loginError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200/50 text-red-800 rounded-none text-[10px]">
                  <span>⚠️ {loginError}</span>
                </div>
              )}

              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-art-text uppercase tracking-widest block">Username</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: admin"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    className="w-full px-3 py-2 border border-art-border rounded-none text-xs focus:outline-hidden focus:border-art-gold bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-art-text uppercase tracking-widest block">Password</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-art-border rounded-none text-xs focus:outline-hidden focus:border-art-gold bg-white"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-art-dark hover:bg-art-gold text-white font-bold text-xs uppercase tracking-widest rounded-none transition-all cursor-pointer"
                >
                  Masuk Sekarang
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
