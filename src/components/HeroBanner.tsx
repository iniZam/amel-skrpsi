import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { Sparkles, ArrowRight, Heart, Award, CheckCircle2 } from 'lucide-react';
import { NailDesign, RecommendationData } from '../types';

interface HeroBannerProps {
  onSelectService: (serviceId: string) => void;
  designs: NailDesign[];
  onNavigateBooking: () => void;
  recommendations?: RecommendationData | null;
}

export default function HeroBanner({
  onSelectService,
  designs,
  onNavigateBooking,
  recommendations
}: HeroBannerProps) {
  // Saring dan urutkan layanan berdasarkan nilai confidence tertinggi dari aturan asosiasi Apriori
  const topConfidenceServices = useMemo(() => {
    const rules = recommendations?.recommendations || [];

    // Urutkan aturan asosiasi berdasarkan confidence tertinggi (descending), lalu lift tertinggi
    const sortedRules = [...rules].sort((a, b) => {
      const confA = typeof a.confidence === 'number' ? a.confidence : 0;
      const confB = typeof b.confidence === 'number' ? b.confidence : 0;
      if (Math.abs(confB - confA) > 0.01) return confB - confA;
      return (b.lift || 0) - (a.lift || 0);
    });

    const confidenceMap = new Map<string, {
      id: string;
      name: string;
      confidence: number;
      lift: number;
      antecedent: string;
      image: string;
      tagline: string;
      price: number;
    }>();

    // Petakan layanan yang dihasilkan (consequent) dengan nilai confidence tertingginya
    for (const rule of sortedRules) {
      const consItems = rule.consequent.split(',').map(s => s.trim().toLowerCase());
      for (const item of consItems) {
        if (!item) continue;
        if (!confidenceMap.has(item)) {
          // Cari data desain yang sesuai dari katalog designs
          const design = designs.find(d => 
            d.id.toLowerCase() === item ||
            d.name.toLowerCase().includes(item) ||
            item.includes(d.id.toLowerCase())
          );

          const confVal = rule.confidence <= 1 
            ? Math.round(rule.confidence * 1000) / 10 
            : Math.round(rule.confidence * 10) / 10;

          confidenceMap.set(item, {
            id: design?.id || item,
            name: design?.name || (item.charAt(0).toUpperCase() + item.slice(1)),
            confidence: confVal,
            lift: Number(rule.lift?.toFixed(2)) || 1.0,
            antecedent: rule.antecedent,
            image: design?.image || "https://images.unsplash.com/photo-1632345031435-8797b2d58045?q=80&w=400&auto=format&fit=crop",
            tagline: `Pola: ${rule.antecedent}`,
            price: design?.price || 120000
          });
        }
      }
    }

    // Fallback awal jika data rekomendasi belum termuat (berdasarkan 31 transaksi riil)
    if (confidenceMap.size === 0) {
      const fallbackList = [
        {
          id: "french crop",
          fallbackName: "French Crop Modern Elegan",
          confidence: 100,
          lift: 2.38,
          antecedent: "chrome, merah maron",
          image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=400&auto=format&fit=crop"
        },
        {
          id: "chrome",
          fallbackName: "Rose & Silver Chrome Mirror",
          confidence: 100,
          lift: 1.29,
          antecedent: "manik-manik",
          image: "https://images.unsplash.com/photo-1632345031435-8797b2d58045?q=80&w=400&auto=format&fit=crop"
        },
        {
          id: "mutiara",
          fallbackName: "Aksen Butiran Mutiara",
          confidence: 83.3,
          lift: 2.87,
          antecedent: "3D bunga, putih",
          image: "https://images.unsplash.com/photo-1519014816548-bf5fe059798b?q=80&w=400&auto=format&fit=crop"
        }
      ];

      return fallbackList.map(item => {
        const design = designs.find(d => d.id === item.id);
        return {
          id: item.id,
          name: design?.name || item.fallbackName,
          confidence: item.confidence,
          lift: item.lift,
          antecedent: item.antecedent,
          image: design?.image || item.image,
          tagline: `Pola: ${item.antecedent}`,
          price: design?.price || 110000
        };
      });
    }

    return Array.from(confidenceMap.values()).slice(0, 3);
  }, [recommendations, designs]);

  const topService = topConfidenceServices[0];

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
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/90 border border-[#FCD5DF] rounded-full text-[#FF5376] text-[10px] font-bold tracking-wider uppercase shadow-2xs">
              <Award className="w-3.5 h-3.5 text-[#FF5376]" />
              <span>CONFIDENCE TERTINGGI ({topService?.confidence || 100}%)</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-sans font-extrabold text-[#2D1F24] leading-tight tracking-tight">
              Temukan Nail Art yang Sesuai dengan Gayamu <span className="text-[#FF5376]">✨</span>
            </h1>

            <p className="text-xs sm:text-sm text-[#8C727D] leading-relaxed max-w-md">
              Direkomendasikan langsung oleh algoritma Apriori berdasarkan tingkat keyakinan (<em>confidence</em>) tertinggi dari pola 31 transaksi pelanggan.
            </p>

            <div className="pt-3">
              <button
                onClick={onNavigateBooking}
                className="inline-flex items-center gap-2.5 px-6 py-3 bg-[#FF5376] hover:bg-[#FF3E66] text-white text-xs font-bold rounded-full transition-all duration-300 shadow-md shadow-pink-300 hover:scale-105 active:scale-95 cursor-pointer"
              >
                <span>Mulai Booking Sekarang</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Center Column: Aesthetic Hand Image with Highest Confidence Badge */}
          <div className="lg:col-span-3 flex justify-center items-center">
            <div className="relative group">
              {/* Floating Top Confidence Tag */}
              {topService && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-xs border border-[#FCD5DF] px-3 py-1 rounded-full shadow-md text-center whitespace-nowrap z-20 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-extrabold text-[#FF5376]">
                    Top Confidence: {topService.confidence}%
                  </span>
                </div>
              )}

              <div className="w-48 sm:w-56 h-48 sm:h-56 rounded-full overflow-hidden border-4 border-white shadow-lg shadow-pink-200/60 bg-[#FFE4EC]">
                <img
                  src={topService?.image || "https://images.unsplash.com/photo-1604654894610-df63bc536371?q=80&w=600&auto=format&fit=crop"}
                  alt={topService?.name || "Nail Art Aesthetic Hand"}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
              </div>

              <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-2 border border-[#FCE2E8] shadow-xs text-[#FF5376]">
                <Heart className="w-4 h-4 fill-[#FF5376]" />
              </div>
            </div>
          </div>

          {/* Right Column: Floating Card "Layanan Confidence Tertinggi" */}
          <div className="lg:col-span-4 bg-white/95 backdrop-blur-xs border border-[#FCD5DF] rounded-2xl p-5 shadow-xs text-left">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#FCE2E8]">
              <div>
                <span className="text-[9px] font-extrabold text-[#FF5376] uppercase tracking-wider block">
                  ALGORITMA APRIORI
                </span>
                <h3 className="font-bold text-xs sm:text-sm text-[#2D1F24] tracking-tight">
                  Layanan Confidence Tertinggi
                </h3>
              </div>
              <div className="p-1.5 bg-[#FFF0F4] rounded-full border border-[#FCD5DF] text-[#FF5376]">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* 3 Mini Cards Grid of Highest Confidence Services */}
            <div className="grid grid-cols-3 gap-2.5">
              {topConfidenceServices.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onSelectService(item.id)}
                  className="group flex flex-col text-left transition-all hover:opacity-95 cursor-pointer"
                >
                  <div className="aspect-square rounded-xl overflow-hidden bg-[#FFF0F4] border border-[#FCE2E8] mb-1.5 relative">
                    <img
                      src={item.image}
                      alt={item.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-1 right-1 bg-[#FF5376] text-white text-[8px] font-extrabold px-1.5 py-0.2 rounded-full shadow-xs">
                      {item.confidence}%
                    </div>
                  </div>
                  <h4 className="text-[11px] font-bold text-[#2D1F24] group-hover:text-[#FF5376] transition-colors leading-tight line-clamp-1">
                    {item.name}
                  </h4>
                  <p className="text-[8.5px] text-[#8C727D] leading-tight line-clamp-2 mt-0.5">
                    {item.tagline}
                  </p>
                </button>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-[#FCE2E8] flex items-center justify-between">
              <span className="text-[9px] text-[#8C727D]">
                Tingkat kepastian tertinggi
              </span>
              <a
                href="#rekomendasi"
                className="inline-flex items-center gap-1 text-[10px] font-bold text-[#FF5376] hover:text-[#E84366] transition-colors uppercase tracking-wider"
              >
                <span>Lihat semua</span>
                <ArrowRight className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
