import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { NailDesign, RecommendationData, Booking } from './types';
import Header from './components/Header';
import HeroBanner from './components/HeroBanner';
import CategoryFilter from './components/CategoryFilter';
import GallerySection from './components/GallerySection';
import FeatureBar from './components/FeatureBar';
import BookingPage from './components/BookingPage';
import AdminSection from './components/AdminSection';
import Footer from './components/Footer';

export default function App() {
  const [designs, setDesigns] = useState<NailDesign[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendationData | null>(null);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [favorites, setFavorites] = useState<string[]>([]);

  // Page Routing View: 'home' | 'booking'
  const [currentView, setCurrentView] = useState<'home' | 'booking'>('home');

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

    // Load saved favorites from local storage
    const savedFavorites = localStorage.getItem('nailove_favorites');
    if (savedFavorites) {
      try {
        setFavorites(JSON.parse(savedFavorites));
      } catch (e) {
        // ignore
      }
    }

    // Hash change handler for dedicated booking page URL navigation
    const handleHash = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash === '#booking' || hash === '#reservasi') {
        setCurrentView('booking');
      } else if (hash === '#hero' || hash === '#home') {
        setCurrentView('home');
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const navigateToBooking = () => {
    setCurrentView('booking');
    window.location.hash = 'booking';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToHome = () => {
    setCurrentView('home');
    window.location.hash = 'home';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToSection = (sectionId: string) => {
    if (currentView !== 'home') {
      setCurrentView('home');
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleToggleFavorite = (id: string) => {
    setFavorites(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      localStorage.setItem('nailove_favorites', JSON.stringify(next));
      return next;
    });
  };

  const handleSelectService = (id: string) => {
    setSelectedServices(prev => {
      if (prev.includes(id)) {
        return prev;
      }
      return [...prev, id];
    });

    // Directly open the dedicated booking page with the chosen service
    navigateToBooking();
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
    <div className="min-h-screen flex flex-col bg-[#FCF8F9] text-[#2D1F24] selection:bg-[#FF5376]/20 selection:text-[#2D1F24]">
      {/* Top Header */}
      <Header
        isAdmin={isAdmin}
        onAdminClick={() => setShowLoginModal(true)}
        onAdminLogout={handleAdminLogout}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        favoritesCount={favorites.length}
        currentView={currentView}
        onNavigateHome={navigateToHome}
        onNavigateBooking={navigateToBooking}
        onNavigateSection={navigateToSection}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {isAdmin ? (
          /* Secure Admin Panel view */
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <AdminSection
              designs={designs}
              onLogout={handleAdminLogout}
              onDesignsUpdated={loadPublicData}
            />
          </motion.div>
        ) : currentView === 'booking' ? (
          /* Dedicated Booking Page View */
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <BookingPage
              designs={designs}
              recommendations={recommendations}
              selectedServices={selectedServices}
              onAddService={(id) => {
                setSelectedServices(prev => prev.includes(id) ? prev : [...prev, id]);
              }}
              onRemoveService={handleRemoveService}
              onClearServices={handleClearServices}
              onNavigateHome={navigateToHome}
              onBookingSuccess={loadPublicData}
            />
          </motion.div>
        ) : (
          /* Customer Home View */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            {/* 1. Hero Banner matching reference image */}
            <HeroBanner
              designs={designs}
              recommendations={recommendations}
              onSelectService={handleSelectService}
              onNavigateBooking={navigateToBooking}
            />

            {/* 2. "Pilih Sesuai Gayamu" Category Filter */}
            <CategoryFilter
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />

            {/* 3. Main Dual-Column: "Rekomendasi Nail Art" & "Motif Nail Art Populer" */}
            <GallerySection
              designs={designs}
              recommendations={recommendations}
              onSelectService={handleSelectService}
              selectedCategory={selectedCategory}
              searchQuery={searchQuery}
              favorites={favorites}
              onToggleFavorite={handleToggleFavorite}
              onNavigateBooking={navigateToBooking}
            />

            {/* 4. Feature Highlight Badges */}
            <FeatureBar />

            {/* 5. Booking CTA Banner on Home View */}
            <section className="py-10 px-4 max-w-7xl mx-auto text-center" id="booking">
              <div className="bg-gradient-to-r from-[#FFF0F4] via-[#FFE5EC] to-[#FFDDE6] border border-[#FCD5DF] rounded-3xl p-8 sm:p-10 shadow-xs relative overflow-hidden">
                <div className="max-w-2xl mx-auto space-y-3 relative z-10">
                  <span className="text-[10px] font-bold tracking-wider text-[#FF5376] bg-white px-3.5 py-1 rounded-full uppercase border border-[#FCD5DF]">
                    RESERVASI PRAKTIS &amp; CEPAT
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-sans font-extrabold text-[#2D1F24] tracking-tight">
                    Siap Mempercantik Kuku Anda?
                  </h2>
                  <p className="text-xs sm:text-sm text-[#8C727D] leading-relaxed">
                    Masuk ke halaman khusus booking untuk memilih tanggal, jam kunjungan, terapis favorit, dan paduan motif kuku terbaik dengan rekomendasi pintar.
                  </p>
                  <div className="pt-3">
                    <button
                      onClick={navigateToBooking}
                      className="px-8 py-3.5 bg-[#FF5376] hover:bg-[#FF3E66] text-white font-bold text-xs uppercase tracking-wider rounded-full transition-all shadow-md shadow-pink-300 hover:scale-105 active:scale-95 cursor-pointer"
                    >
                      Buka Halaman Khusus Booking
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </motion.div>
        )}
      </main>

      {/* Rose Pink Footer */}
      <Footer
        onNavigateHome={navigateToHome}
        onNavigateBooking={navigateToBooking}
      />

      {/* Admin Login Dialog Modal */}
      <AnimatePresence>
        {showLoginModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLoginModal(false)}
              className="absolute inset-0 bg-[#2D1F24]/50 backdrop-blur-xs"
            />

            {/* Dialog Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-sm bg-white border border-[#FCE2E8] rounded-3xl p-6 sm:p-8 shadow-2xl z-10 text-left"
            >
              <div className="text-center mb-5">
                <span className="text-[10px] font-bold tracking-wider text-[#FF5376] bg-[#FFF0F4] px-3 py-1 rounded-full uppercase border border-[#FCD5DF]">
                  KONSOL PENGELOLA
                </span>
                <h3 className="text-xl font-sans font-bold text-[#2D1F24] mt-2.5">
                  Masuk Dashboard Admin
                </h3>
                <p className="text-[#8C727D] text-[11px] mt-1 leading-relaxed">
                  Kelola antrean reservasi & parameter algoritma Apriori. (Akun bawaan: admin / admin123)
                </p>
              </div>

              {loginError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-[11px]">
                  <span>⚠️ {loginError}</span>
                </div>
              )}

              <form onSubmit={handleAdminLogin} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#2D1F24]">Username</label>
                  <input
                    type="text"
                    required
                    placeholder="admin"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#FFF0F4] border border-[#FCE2E8] rounded-full text-xs text-[#2D1F24] focus:outline-hidden focus:border-[#FF5376] focus:bg-white transition-all shadow-2xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#2D1F24]">Password</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#FFF0F4] border border-[#FCE2E8] rounded-full text-xs text-[#2D1F24] focus:outline-hidden focus:border-[#FF5376] focus:bg-white transition-all shadow-2xs"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-[#FF5376] hover:bg-[#FF3E66] text-white font-bold text-xs uppercase tracking-wider rounded-full transition-all shadow-md shadow-pink-200 cursor-pointer mt-2"
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
