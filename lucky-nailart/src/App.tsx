import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { NailDesign, RecommendationData } from './types';
import Header from './components/Header';
import HeroBanner from './components/HeroBanner';
import CategoryFilter from './components/CategoryFilter';
import GallerySection from './components/GallerySection';
import FeatureBar from './components/FeatureBar';
import BookingSection from './components/BookingSection';
import AdminSection from './components/AdminSection';
import Footer from './components/Footer';

export default function App() {
  const [designs, setDesigns] = useState<NailDesign[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendationData | null>(null);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [favorites, setFavorites] = useState<string[]>([]);

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
  }, []);

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
    <div className="min-h-screen flex flex-col bg-[#FCF8F9] text-[#2D1F24] selection:bg-[#FF5376]/20 selection:text-[#2D1F24]">
      {/* Top Header matching reference */}
      <Header
        isAdmin={isAdmin}
        onAdminClick={() => setShowLoginModal(true)}
        onAdminLogout={handleAdminLogout}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        favoritesCount={favorites.length}
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
            <AdminSection designs={designs} onLogout={handleAdminLogout} />
          </motion.div>
        ) : (
          /* Customer View */
          <div>
            {/* 1. Hero Banner matching reference image */}
            <HeroBanner
              designs={designs}
              onSelectService={handleSelectService}
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
            />

            {/* 4. Bottom 4 Feature Highlight Badges */}
            <FeatureBar />

            {/* 5. Appointment Scheduler Booking Section */}
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

      {/* Rose Pink Footer matching reference */}
      <Footer />

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
                <h3 className="text-xl font-serif font-bold text-[#2D1F24] mt-2.5">
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
