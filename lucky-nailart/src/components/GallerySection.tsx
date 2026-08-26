import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Heart, Star, ArrowRight, Sparkles, Check, Flame, Award, Plus } from 'lucide-react';
import { NailDesign, RecommendationData } from '../types';

interface GallerySectionProps {
  designs: NailDesign[];
  recommendations: RecommendationData | null;
  onSelectService: (serviceId: string) => void;
  selectedCategory: string;
  searchQuery: string;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
}

export default function GallerySection({
  designs,
  recommendations,
  onSelectService,
  selectedCategory,
  searchQuery,
  favorites,
  onToggleFavorite
}: GallerySectionProps) {
  const [activeMotifStep, setActiveMotifStep] = useState<string | null>(null);

  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(value);
  };

  // Filter designs based on category and search query
  const filteredDesigns = designs.filter(design => {
    const matchesCat = selectedCategory === 'Semua' || (design.category && design.category.toLowerCase() === selectedCategory.toLowerCase());
    const matchesQuery = searchQuery === '' || 
      design.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      design.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (design.styleSubtitle && design.styleSubtitle.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesQuery;
  });

  // Popular Step-by-Step Motifs matching reference image
  const POPULAR_MOTIFS = [
    {
      id: "floral-step",
      name: "Floral Sederhana",
      icon: "🌸",
      difficulty: "Mudah • 4 Langkah",
      relatedServiceId: "Floral_Accent",
      steps: [
        { num: 1, label: "Base Gel Nude", desc: "Aplikasikan 2 lapis dasar nude pink dan keringkan LED." },
        { num: 2, label: "Titik Kelopak", desc: "Buat 5 titik putih melingkar menggunakan dotting tool." },
        { num: 3, label: "Pusat Bunga", desc: "Tambahkan titik emas/kuning di tengah kelopak." },
        { num: 4, label: "Glossy Top Coat", desc: "Kunci motif dengan lapisan kilap tahan lama." }
      ]
    },
    {
      id: "hearts-step",
      name: "Hearts Minimalist",
      icon: "🤍",
      difficulty: "Mudah • 4 Langkah",
      relatedServiceId: "Nude_Gel",
      steps: [
        { num: 1, label: "Sheer Milky Pink", desc: "Gunakan dasar sheer milky pink lembut transparan." },
        { num: 2, label: "2 Titik Hati", desc: "Teteskan 2 titik berdekatan pada accent nail." },
        { num: 3, label: "Tarik Sudut Bawah", desc: "Tarik kedua titik ke bawah hingga membentuk hati mungil." },
        { num: 4, label: "Top Coat Segel", desc: "Lapisi top coat pelindung anti gores." }
      ]
    },
    {
      id: "french-step",
      name: "French Tips Modern",
      icon: "☕",
      difficulty: "Mudah • 4 Langkah",
      relatedServiceId: "French_Tips",
      steps: [
        { num: 1, label: "Neutral Base", desc: "Aplikasikan dasar bening atau peach natural." },
        { num: 2, label: "Garis Senyum Halus", desc: "Lukis lengkungan putih tipis di ujung kuku." },
        { num: 3, label: "Aksen Garis Ganda", desc: "Tambahkan garis nude kontur melengkung lembut." },
        { num: 4, label: "Mirror Top Coat", desc: "Keringkan hingga kilap kristal maksimal." }
      ]
    },
    {
      id: "glitter-step",
      name: "Glitter Ombre",
      icon: "✨",
      difficulty: "Mudah • 4 Langkah",
      relatedServiceId: "Glitter_Red",
      steps: [
        { num: 1, label: "Warna Dasar Berry", desc: "Gunakan warna berry pink lembut sebagai transisi." },
        { num: 2, label: "Ketukan Glitter", desc: "Dab glitter partikel halus mulai dari ujung kuku." },
        { num: 3, label: "Baurkan ke Tengah", desc: "Ratakan secara halus ke arah kutikula." },
        { num: 4, label: "Lapisan Gel Halus", desc: "Keringkan dan kunci tekstur glitter agar rata halus." }
      ]
    }
  ];

  return (
    <section className="pt-4 pb-12 px-4 max-w-7xl mx-auto text-left" id="rekomendasi">
      {/* Main Dual-Column Layout matching reference image */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Rekomendasi Nail Art Grid (7 or 8 columns on large screens) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4" id="gallery">
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-bold text-[#2D1F24] tracking-tight">
              Rekomendasi Nail Art
            </h3>
            <a
              href="#booking"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#FF5376] hover:text-[#E84366] transition-colors"
            >
              <span>Lihat semua</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-4">
            {filteredDesigns.length > 0 ? (
              filteredDesigns.map((design) => {
                const isLiked = favorites.includes(design.id);

                return (
                  <div
                    key={design.id}
                    className="group bg-white border border-[#FCE2E8] rounded-2xl overflow-hidden hover:shadow-md hover:shadow-pink-100 transition-all duration-300 flex flex-col"
                  >
                    {/* Image Area with Badge & Heart Button */}
                    <div className="relative aspect-4/3 overflow-hidden bg-[#FFF0F4]">
                      <img
                        src={design.image}
                        alt={design.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />

                      {/* Top-Right Favorite Heart */}
                      <button
                        onClick={() => onToggleFavorite(design.id)}
                        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-xs border border-[#FCE2E8] flex items-center justify-center text-[#8C727D] hover:text-[#FF5376] transition-all cursor-pointer shadow-2xs"
                        title={isLiked ? "Hapus dari favorit" : "Sukai desain ini"}
                      >
                        <Heart
                          className={`w-4 h-4 transition-transform active:scale-125 ${
                            isLiked ? 'text-[#FF5376] fill-[#FF5376]' : ''
                          }`}
                        />
                      </button>

                      {/* Bottom-Left Tag Badge */}
                      <div className="absolute bottom-3 left-3">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FF5376] text-white shadow-xs uppercase tracking-wider">
                          {design.tag || "Populer"}
                        </span>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <h4 className="font-bold text-sm text-[#2D1F24] group-hover:text-[#FF5376] transition-colors leading-tight">
                            {design.name}
                          </h4>
                          {/* Rating */}
                          <div className="flex items-center gap-1 text-[11px] font-bold text-[#FF5376] shrink-0">
                            <Star className="w-3.5 h-3.5 fill-[#FFB800] text-[#FFB800]" />
                            <span>{design.rating || 4.8}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-[#8C727D] mb-3">
                          <span>{design.styleSubtitle || "Natural, Feminim"}</span>
                          <span className="font-bold text-[#2D1F24]">{formatRupiah(design.price)}</span>
                        </div>
                      </div>

                      {/* Action Button */}
                      <button
                        onClick={() => onSelectService(design.id)}
                        className="w-full py-2.5 px-4 bg-[#FFF0F4] hover:bg-[#FF5376] text-[#FF5376] hover:text-white border border-[#FCD5DF] hover:border-[#FF5376] text-xs font-bold rounded-full transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Pilih Layanan</span>
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-2 p-8 text-center bg-white border border-[#FCE2E8] rounded-2xl">
                <p className="text-xs text-[#8C727D]">Tidak ada motif kuku yang cocok dengan filter saat ini.</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Motif Nail Art Populer & Apriori Intelligence (5 or 4 columns) */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-6" id="motif">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-bold text-[#2D1F24] tracking-tight">
              Motif Nail Art Populer
            </h3>
            <a
              href="#booking"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#FF5376] hover:text-[#E84366] transition-colors"
            >
              <span>Lihat semua</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* 4 Step-by-Step Motif Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
            {POPULAR_MOTIFS.map((motif) => (
              <div
                key={motif.id}
                className="bg-white border border-[#FCE2E8] rounded-2xl p-4 hover:shadow-xs hover:border-[#F9BFCB] transition-all"
              >
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{motif.icon}</span>
                    <h4 className="text-xs sm:text-sm font-bold text-[#2D1F24]">
                      {motif.name}
                    </h4>
                  </div>
                  <span className="text-[10px] text-[#8C727D] font-medium">
                    {motif.difficulty}
                  </span>
                </div>

                {/* 4 Nail Steps Visual Mockup */}
                <div className="grid grid-cols-4 gap-1.5 mb-2">
                  {motif.steps.map((step) => (
                    <div
                      key={step.num}
                      className="bg-[#FFF0F4] border border-[#FCE2E8] rounded-xl p-1.5 text-center flex flex-col items-center justify-between h-14 group/step relative cursor-help"
                      title={`${step.label}: ${step.desc}`}
                    >
                      <span className="w-4 h-4 rounded-full bg-white text-[#FF5376] text-[9px] font-bold flex items-center justify-center shadow-2xs">
                        {step.num}
                      </span>
                      <span className="text-[8px] font-bold text-[#8C727D] leading-tight line-clamp-1">
                        {step.label}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Quick Add Button */}
                <button
                  onClick={() => onSelectService(motif.relatedServiceId)}
                  className="w-full py-1.5 text-[10px] font-bold text-[#FF5376] hover:text-[#E84366] hover:bg-[#FFF0F4] rounded-full transition-all text-center flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3 text-[#FF5376]" />
                  <span>Tambahkan ke Rencana Perawatan</span>
                </button>
              </div>
            ))}
          </div>

          {/* Apriori Best Sellers & Bundling Card */}
          <div className="bg-gradient-to-br from-[#FFF0F4] to-[#FFE8EE] border border-[#FCD5DF] rounded-2xl p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-full bg-[#FF5376] text-white flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#2D1F24] leading-tight">
                  Kombinasi Terfavorit (Apriori AI)
                </h4>
                <p className="text-[9px] text-[#8C727D]">
                  Pola transaksi nyata ribuan pelanggan setia
                </p>
              </div>
            </div>

            {/* Association Rules / Best seller combo */}
            {recommendations && recommendations.bestSellers.length > 0 ? (
              <div className="space-y-2">
                {recommendations.bestSellers.slice(0, 3).map((itemset, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-white/90 rounded-xl border border-[#FCE2E8] flex items-center justify-between text-xs"
                  >
                    <div className="flex flex-wrap items-center gap-1 pr-2">
                      {itemset.items.map((it, i) => (
                        <React.Fragment key={i}>
                          {i > 0 && <span className="text-[#B59BA6] text-[10px]">&</span>}
                          <span className="px-2 py-0.5 bg-[#FFF0F4] text-[#2D1F24] font-bold text-[10px] rounded-full">
                            {it}
                          </span>
                        </React.Fragment>
                      ))}
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[9px] text-[#FF5376] font-bold block">{itemset.support}%</span>
                      <span className="text-[8px] text-[#8C727D] block">{itemset.count} Transaksi</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 bg-white/80 rounded-xl text-center text-[10px] text-[#8C727D]">
                Mengumpulkan pola transaksi pelanggan...
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
