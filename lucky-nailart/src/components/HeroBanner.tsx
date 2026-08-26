import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, ArrowRight, Heart } from 'lucide-react';
import { NailDesign } from '../types';

interface HeroBannerProps {
  onSelectService: (serviceId: string) => void;
  designs: NailDesign[];
}

export default function HeroBanner({ onSelectService, designs }: HeroBannerProps) {
  // Top 3 featured daily recommendations matching the reference
  const dailyRecommendations = [
    {
      id: "Floral_Accent",
      name: "Soft Pink Floral",
      tagline: "Terlihat manis & elegan",
      image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=400&auto=format&fit=crop"
    },
    {
      id: "Nude_Gel",
      name: "Minimalist Line",
      tagline: "Simple tapi tetap keren",
      image: "https://images.unsplash.com/photo-1607779097040-26e80aa78e66?q=80&w=400&auto=format&fit=crop"
    },
    {
      id: "Glitter_Red",
      name: "Glitter Glam",
      tagline: "Untuk tampilan lebih berkilau",
      image: "https://images.unsplash.com/photo-1519014816548-bf5fe059798b?q=80&w=400&auto=format&fit=crop"
    }
  ];

  return (
    <section className="pt-6 pb-4 px-4 max-w-7xl mx-auto" id="hero">
      {/* Main Pink Hero Container */}
      <div className="relative bg-gradient-to-r from-[#FFF0F4] via-[#FFE4EC] to-[#FFDDE6] border border-[#FCD5DF] rounded-3xl lg:rounded-[2.5rem] p-6 sm:p-8 lg:p-12 overflow-hidden shadow-xs">
        {/* Subtle Decorative Star Sparkles */}
        <div className="absolute top-8 left-1/3 text-[#FF5376]/40 pointer-events-none animate-pulse">
          <Sparkles className="w-5 h-5" />
        </div>
        <div className="absolute bottom-10 left-1/4 text-[#FF5376]/30 pointer-events-none">
          <Sparkles className="w-4 h-4" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          {/* Left Column: Heading & CTA */}
          <div className="lg:col-span-5 text-left space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/80 border border-[#FCD5DF] rounded-full text-[#FF5376] text-[10px] font-bold tracking-wider uppercase">
              <Sparkles className="w-3 h-3 text-[#FF5376]" />
              <span>REKOMENDASI UNTUKMU</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-[#2D1F24] leading-tight tracking-tight">
              Temukan Nail Art yang Sesuai dengan Gayamu <span className="text-[#FF5376]">✨</span>
            </h1>

            <p className="text-xs sm:text-sm text-[#8C727D] leading-relaxed max-w-md">
              Jelajahi berbagai pilihan nail art cantik dan temukan motif yang paling cocok untukmu dengan kecerdasan analisis pola cerdas kami.
            </p>

            <div className="pt-3">
              <a
                href="#booking"
                className="inline-flex items-center gap-2.5 px-6 py-3 bg-[#FF5376] hover:bg-[#FF3E66] text-white text-xs font-bold rounded-full transition-all duration-300 shadow-md shadow-pink-300 hover:scale-105 active:scale-95 cursor-pointer"
              >
                <span>Mulai Sekarang</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Center Column: Aesthetic Hand Image */}
          <div className="lg:col-span-3 flex justify-center items-center">
            <div className="relative group">
              <div className="w-48 sm:w-56 h-48 sm:h-56 rounded-full overflow-hidden border-4 border-white shadow-lg shadow-pink-200/60 bg-[#FFE4EC]">
                <img
                  src="https://images.unsplash.com/photo-1604654894610-df63bc536371?q=80&w=600&auto=format&fit=crop"
                  alt="Nail Art Floral Aesthetic Hand"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-2 border border-[#FCE2E8] shadow-xs text-[#FF5376]">
                <Heart className="w-4 h-4 fill-[#FF5376]" />
              </div>
            </div>
          </div>

          {/* Right Column: Floating Card "Rekomendasi Hari Ini" */}
          <div className="lg:col-span-4 bg-white/95 backdrop-blur-xs border border-[#FCD5DF] rounded-2xl p-5 shadow-xs text-left">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#FCE2E8]">
              <h3 className="font-bold text-xs sm:text-sm text-[#2D1F24] tracking-tight">
                Rekomendasi Hari Ini
              </h3>
              <Heart className="w-4 h-4 text-[#FF5376] fill-[#FF5376]" />
            </div>

            {/* 3 Mini Cards Grid */}
            <div className="grid grid-cols-3 gap-2.5">
              {dailyRecommendations.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onSelectService(item.id)}
                  className="group flex flex-col text-left transition-all hover:opacity-90 cursor-pointer"
                >
                  <div className="aspect-square rounded-xl overflow-hidden bg-[#FFF0F4] border border-[#FCE2E8] mb-1.5 relative">
                    <img
                      src={item.image}
                      alt={item.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <h4 className="text-[11px] font-bold text-[#2D1F24] group-hover:text-[#FF5376] transition-colors leading-tight line-clamp-1">
                    {item.name}
                  </h4>
                  <p className="text-[9px] text-[#8C727D] leading-tight line-clamp-2 mt-0.5">
                    {item.tagline}
                  </p>
                </button>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-[#FCE2E8] text-right">
              <a
                href="#rekomendasi"
                className="inline-flex items-center gap-1 text-[10px] font-bold text-[#FF5376] hover:text-[#E84366] transition-colors uppercase tracking-wider"
              >
                <span>Lihat semua rekomendasi</span>
                <ArrowRight className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
