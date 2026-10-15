import React from 'react';
import { Search, Bell, Heart, Shield, LogOut, Sparkles } from 'lucide-react';

interface HeaderProps {
  isAdmin: boolean;
  onAdminClick: () => void;
  onAdminLogout: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  favoritesCount: number;
  currentView: 'home' | 'booking';
  onNavigateHome: () => void;
  onNavigateBooking: () => void;
  onNavigateSection: (sectionId: string) => void;
}

export default function Header({
  isAdmin,
  onAdminClick,
  onAdminLogout,
  searchQuery,
  onSearchChange,
  favoritesCount,
  currentView,
  onNavigateHome,
  onNavigateBooking,
  onNavigateSection
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-[#FCF8F9]/95 backdrop-blur-md border-b border-[#FCE2E8] py-3.5 px-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left: Brand Logo & Navigation */}
        <div className="flex items-center gap-8">
          {/* Logo */}
          <button
            onClick={onNavigateHome}
            className="flex items-center gap-1.5 group cursor-pointer text-left"
          >
            <span className="font-script text-3xl md:text-4xl text-[#FF5376] font-bold tracking-tight">
              Nailove
            </span>
            <span className="inline-block w-2 h-2 rounded-full bg-[#FF5376] animate-pulse -mt-2" />
          </button>

          {/* Nav Links */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-[#8C727D]">
            <button
              onClick={onNavigateHome}
              className={`pb-1 transition-all cursor-pointer ${
                currentView === 'home'
                  ? 'text-[#FF5376] border-b-2 border-[#FF5376] font-bold'
                  : 'hover:text-[#FF5376]'
              }`}
            >
              Beranda
            </button>
            <button
              onClick={() => onNavigateSection('rekomendasi')}
              className="hover:text-[#FF5376] transition-colors pb-1 cursor-pointer"
            >
              Rekomendasi
            </button>
            <button
              onClick={() => onNavigateSection('motif')}
              className="hover:text-[#FF5376] transition-colors pb-1 cursor-pointer"
            >
              Motif
            </button>
            <button
              onClick={() => onNavigateSection('gallery')}
              className="hover:text-[#FF5376] transition-colors pb-1 cursor-pointer"
            >
              Galeri
            </button>
            <button
              onClick={onNavigateBooking}
              className={`pb-1 transition-all cursor-pointer flex items-center gap-1 ${
                currentView === 'booking'
                  ? 'text-[#FF5376] border-b-2 border-[#FF5376] font-bold'
                  : 'hover:text-[#FF5376]'
              }`}
            >
              <span>Halaman Booking</span>
              <span className="px-1.5 py-0.2 bg-[#FF5376] text-white text-[9px] rounded-full font-bold">
                Baru
              </span>
            </button>
            <button
              onClick={() => onNavigateSection('features')}
              className="hover:text-[#FF5376] transition-colors pb-1 cursor-pointer"
            >
              Tentang
            </button>
          </nav>
        </div>

        {/* Middle: Search Bar */}
        <div className="flex-1 max-w-md hidden sm:block">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Cari motif atau gaya..."
              className="w-full bg-[#FFF0F4] border border-[#FCE2E8] text-[#2D1F24] placeholder-[#B59BA6] text-xs rounded-full py-2.5 pl-9 pr-4 focus:outline-hidden focus:border-[#FF5376] focus:bg-white transition-all shadow-2xs"
            />
            <Search className="w-3.5 h-3.5 text-[#B59BA6] absolute left-3.5 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        {/* Right: Actions (Notification, Favorites, Admin/Profile) */}
        <div className="flex items-center gap-3">
          {/* Favorites Heart Icon */}
          <button
            onClick={() => onNavigateSection('gallery')}
            className="p-2 rounded-full bg-[#FFF0F4] text-[#8C727D] hover:text-[#FF5376] hover:bg-[#FFE4EC] transition-all relative border border-[#FCE2E8] cursor-pointer"
            title="Lihat Galeri Favorit"
          >
            <Heart className="w-4 h-4 fill-transparent hover:fill-[#FF5376]" />
            {favoritesCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#FF5376] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {favoritesCount}
              </span>
            )}
          </button>

          {/* Notification bell */}
          <button
            onClick={() => onNavigateSection('rekomendasi')}
            className="p-2 rounded-full bg-[#FFF0F4] text-[#8C727D] hover:text-[#FF5376] hover:bg-[#FFE4EC] transition-all border border-[#FCE2E8] cursor-pointer"
            title="Pemberitahuan Rekomendasi"
          >
            <Bell className="w-4 h-4" />
          </button>

          {/* Admin / Profile button */}
          {isAdmin ? (
            <button
              onClick={onAdminLogout}
              className="py-2 px-3.5 bg-red-50 text-red-600 border border-red-200 text-[10px] font-bold uppercase tracking-wider rounded-full hover:bg-red-100 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          ) : (
            <button
              onClick={onAdminClick}
              className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-full bg-[#FFF0F4] hover:bg-[#FFE4EC] border border-[#FCE2E8] text-[#2D1F24] transition-all cursor-pointer shadow-2xs"
              title="Konsol Admin"
            >
              <div className="w-6 h-6 rounded-full overflow-hidden border border-[#FF5376]/40 flex items-center justify-center bg-white">
                <img
                  src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=120&auto=format&fit=crop"
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-[11px] font-bold text-[#8C727D] hidden md:inline flex items-center gap-1">
                <Shield className="w-3 h-3 text-[#FF5376]" />
                Admin
              </span>
            </button>
          )}

          {/* Booking Pill CTA */}
          <button
            onClick={onNavigateBooking}
            className={`py-2 px-4 text-white text-[11px] font-bold rounded-full transition-all shadow-xs hidden sm:flex items-center gap-1.5 cursor-pointer ${
              currentView === 'booking'
                ? 'bg-[#E84366] ring-2 ring-[#FF5376]/30 shadow-pink-300'
                : 'bg-[#FF5376] hover:bg-[#FF3E66] shadow-pink-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Booking Online</span>
          </button>
        </div>
      </div>
    </header>
  );
}
