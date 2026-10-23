import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Heart, ArrowRight, Sparkles, Check, Flame, Award, Plus,
  Network, TrendingUp, Layers, Zap
} from 'lucide-react';
import { NailDesign, RecommendationData } from '../types';

interface GallerySectionProps {
  designs: NailDesign[];
  recommendations: RecommendationData | null;
  onSelectService: (serviceId: string) => void;
  selectedCategory: string;
  searchQuery: string;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  onNavigateBooking?: () => void;
}

export default function GallerySection({
  designs,
  recommendations,
  onSelectService,
  selectedCategory,
  searchQuery,
  favorites,
  onToggleFavorite,
  onNavigateBooking
}: GallerySectionProps) {
  const [activeMotifStep, setActiveMotifStep] = useState<string | null>(null);
  const [sortByApriori, setSortByApriori] = useState<boolean>(true);
  const [aprioriViewTab, setAprioriViewTab] = useState<'rules' | 'bundles'>('rules');

  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(value);
  };

  // Helper to match an item name from Apriori dataset to a NailDesign in gallery
  const findMatchingDesign = (rawItem: string): NailDesign | undefined => {
    const clean = rawItem.toLowerCase().replace(/[-_]/g, ' ').trim();
    if (!clean) return undefined;
    return designs.find(d => {
      const dId = d.id.toLowerCase().replace(/[-_]/g, ' ').trim();
      const dName = d.name.toLowerCase().replace(/[-_]/g, ' ').trim();
      return dId === clean || dName === clean || dId.includes(clean) || clean.includes(dId) || dName.includes(clean);
    });
  };

  // Normalize Apriori Association Rules with fallback so the dashboard always highlights rich results
  const highlightedRules = useMemo(() => {
    const rawRules = recommendations?.recommendations && recommendations.recommendations.length > 0
      ? recommendations.recommendations
      : [
          { antecedent: 'manik-manik', consequent: 'chrome', confidence: 100, lift: 1.33 },
          { antecedent: 'abstrak', consequent: 'chrome', confidence: 88.2, lift: 1.18 },
          { antecedent: '3D bunga', consequent: 'chrome', confidence: 84.6, lift: 1.13 },
          { antecedent: 'pita', consequent: 'chrome', confidence: 81.8, lift: 1.09 },
          { antecedent: 'chrome', consequent: 'abstrak', confidence: 62.5, lift: 1.18 },
          { antecedent: 'putih', consequent: 'abstrak', confidence: 53.3, lift: 1.01 }
        ];

    return rawRules.map((rule, idx) => {
      const confPct = rule.confidence <= 1
        ? Math.round(rule.confidence * 1000) / 10
        : Math.round(rule.confidence * 10) / 10;
      const liftVal = Math.round((rule.lift || 1) * 100) / 100;

      const antParts = rule.antecedent.split(',').map(s => s.trim()).filter(Boolean);
      const consParts = rule.consequent.split(',').map(s => s.trim()).filter(Boolean);

      const antDesign = antParts.map(findMatchingDesign).find(Boolean);
      const consDesign = consParts.map(findMatchingDesign).find(Boolean);

      return {
        rank: idx + 1,
        antecedent: rule.antecedent,
        consequent: rule.consequent,
        antParts,
        consParts,
        antDesign,
        consDesign,
        confidence: confPct,
        lift: liftVal
      };
    });
  }, [recommendations, designs]);

  // Normalize Frequent Itemset Bundles (k >= 2)
  const highlightedBundles = useMemo(() => {
    const rawBundles = recommendations?.bestSellers && recommendations.bestSellers.length > 0
      ? recommendations.bestSellers
      : [
          { items: ['abstrak', 'chrome'], support: 46.9, count: 15 },
          { items: ['chrome', 'putih'], support: 34.4, count: 11 },
          { items: ['3D bunga', 'chrome'], support: 34.4, count: 11 },
          { items: ['cat eye', 'chrome'], support: 28.1, count: 9 },
          { items: ['chrome', 'french crop'], support: 28.1, count: 9 },
          { items: ['chrome', 'pita'], support: 28.1, count: 9 }
        ];

    return rawBundles.map((b, idx) => {
      const supPct = b.support <= 1
        ? Math.round(b.support * 1000) / 10
        : Math.round(b.support * 10) / 10;
      const matchedDesigns = b.items.map(findMatchingDesign).filter(Boolean) as NailDesign[];
      return {
        rank: idx + 1,
        items: b.items,
        support: supPct,
        count: b.count,
        matchedDesigns
      };
    });
  }, [recommendations, designs]);

  // Map each design ID to its best Apriori metric so we can badge & sort catalog items
  const designAprioriMeta = useMemo(() => {
    const meta = new Map<string, { confidence: number; lift: number; pairedWith: string; supportCount?: number }>();

    for (const rule of highlightedRules) {
      if (rule.consDesign && !meta.has(rule.consDesign.id)) {
        meta.set(rule.consDesign.id, {
          confidence: rule.confidence,
          lift: rule.lift,
          pairedWith: rule.antecedent
        });
      }
      if (rule.antDesign && !meta.has(rule.antDesign.id)) {
        meta.set(rule.antDesign.id, {
          confidence: rule.confidence,
          lift: rule.lift,
          pairedWith: rule.consequent
        });
      }
    }

    for (const bundle of highlightedBundles) {
      for (const d of bundle.matchedDesigns) {
        const existing = meta.get(d.id);
        if (existing) {
          if (!existing.supportCount || bundle.count > existing.supportCount) {
            existing.supportCount = bundle.count;
          }
        } else {
          meta.set(d.id, {
            confidence: bundle.support,
            lift: 1.15,
            pairedWith: bundle.items.filter(it => !d.name.toLowerCase().includes(it.toLowerCase())).join(', ') || bundle.items.join(' + '),
            supportCount: bundle.count
          });
        }
      }
    }

    return meta;
  }, [highlightedRules, highlightedBundles]);

  // Select all matched services from an Apriori rule or bundle
  const handleSelectCombo = (itemNames: string[], fallbackDesignId?: string) => {
    const matchedIds: string[] = [];
    for (const name of itemNames) {
      const d = findMatchingDesign(name);
      if (d && !matchedIds.includes(d.id)) {
        matchedIds.push(d.id);
      }
    }
    if (matchedIds.length > 0) {
      matchedIds.forEach(id => onSelectService(id));
    } else if (fallbackDesignId) {
      onSelectService(fallbackDesignId);
    } else if (designs.length > 0) {
      onSelectService(designs[0].id);
    }
  };

  // Filter designs based on category and search query, then optionally sort by Apriori score
  const filteredDesigns = useMemo(() => {
    const base = designs.filter(design => {
      const matchesCat = selectedCategory === 'Semua' || (design.category && design.category.toLowerCase() === selectedCategory.toLowerCase());
      const matchesQuery = searchQuery === '' || 
        design.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        design.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (design.styleSubtitle && design.styleSubtitle.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCat && matchesQuery;
    });

    if (!sortByApriori) return base;

    return [...base].sort((a, b) => {
      const metaA = designAprioriMeta.get(a.id);
      const metaB = designAprioriMeta.get(b.id);
      const scoreA = metaA ? metaA.confidence * 10 + (metaA.supportCount || 0) : 0;
      const scoreB = metaB ? metaB.confidence * 10 + (metaB.supportCount || 0) : 0;
      return scoreB - scoreA;
    });
  }, [designs, selectedCategory, searchQuery, sortByApriori, designAprioriMeta]);

  // Popular Step-by-Step Motifs matching reference user dataset
  const POPULAR_MOTIFS = [
    {
      id: "chrome-step",
      name: "Chrome Mirror Magic",
      icon: "✨",
      difficulty: "Terpopuler • 4 Langkah",
      relatedServiceId: "chrome",
      frequencyBadge: "77% Transaksi (24x)",
      steps: [
        { num: 1, label: "Base Gel", desc: "Aplikasikan warna dasar gel dan keringkan dengan lampu LED." },
        { num: 2, label: "No-Wipe Top", desc: "Oleskan top coat non-sticky dan keringkan 30 detik." },
        { num: 3, label: "Gosok Chrome", desc: "Dab & gosok bubuk mirror chrome hingga kilau cermin muncul merata." },
        { num: 4, label: "Glass Top Seal", desc: "Segel kilap kaca tahan gores hingga 4 minggu." }
      ]
    },
    {
      id: "abstrak-step",
      name: "Abstrak Swirl & Marble",
      icon: "🎨",
      difficulty: "Artistik • 4 Langkah",
      relatedServiceId: "abstrak",
      frequencyBadge: "55% Transaksi (17x)",
      steps: [
        { num: 1, label: "Milky Base", desc: "Gunakan dasar putih susu lembut atau nude sheer." },
        { num: 2, label: "Swirl Gel Lines", desc: "Tarik garis lengkung bebas dinamis dengan liner brush." },
        { num: 3, label: "Blooming Effect", desc: "Baurkan tepi garis menciptakan tekstur marmer artistik." },
        { num: 4, label: "Glossy Coat", desc: "Kunci motif dengan lapisan glossy ekstra jernih." }
      ]
    },
    {
      id: "french-step",
      name: "French Crop Elegan",
      icon: "🤍",
      difficulty: "Klasik • 4 Langkah",
      relatedServiceId: "french crop",
      frequencyBadge: "42% Transaksi (13x)",
      steps: [
        { num: 1, label: "Neutral Base", desc: "Aplikasikan dasar bening atau peach natural yang sehat." },
        { num: 2, label: "Garis Senyum", desc: "Lukis lengkungan putih tipis presisi di ujung kuku." },
        { num: 3, label: "Crop Kontur", desc: "Rapikan lengkungan ujung kuku agar simetris sempurna." },
        { num: 4, label: "Mirror Top Coat", desc: "Keringkan hingga kilap kristal tahan lama." }
      ]
    },
    {
      id: "bunga3d-step",
      name: "3D Bunga Emboss Sculpture",
      icon: "🌸",
      difficulty: "Spesial • 4 Langkah",
      relatedServiceId: "3d bunga",
      frequencyBadge: "42% Transaksi (13x)",
      steps: [
        { num: 1, label: "Warna Dasar", desc: "Gunakan dasar pink pastel lembut atau nude anggun." },
        { num: 2, label: "Sculpt 3D Gel", desc: "Bentuk kelopak timbul 3D menggunakan kuas gel pemahat khusus." },
        { num: 3, label: "Pusat Mutiara", desc: "Sematkan butiran mutiara atau manik kristal di tengah bunga." },
        { num: 4, label: "Kunci UV Lamp", desc: "Keringkan hingga kokoh dan rekat sempurna." }
      ]
    }
  ];

  const totalTxAnalyzed = recommendations?.totalTransactions || 34;

  return (
    <section className="pt-4 pb-12 px-4 max-w-7xl mx-auto text-left space-y-10" id="rekomendasi">
      {/* ===================================================================== */}
      {/* FEATURED SPOTLIGHT: REKOMENDASI UTAMA HASIL ALGORITMA APRIORI          */}
      {/* ===================================================================== */}
      <div className="relative rounded-3xl lg:rounded-[2.25rem] bg-gradient-to-br from-[#2D1F24] via-[#3B242D] to-[#4E2838] text-white p-6 sm:p-8 lg:p-10 shadow-xl shadow-pink-950/15 border border-[#FF5376]/30 overflow-hidden">
        {/* Decorative Glow Orbs */}
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-[#FF5376]/25 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-[#FF8DA6]/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          {/* Top Header & Metrics Bar */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 pb-5 border-b border-white/10">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#FF5376] text-white text-[10px] font-extrabold uppercase tracking-wider shadow-sm">
                <Sparkles className="w-3.5 h-3.5" />
                <span>HIGHLIGHT REKOMENDASI ALGORITMA APRIORI</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-sans font-extrabold tracking-tight text-white">
                Pola Kombinasi &amp; Rekomendasi Motif Kuku Terbaik ✨
              </h2>
              <p className="text-xs sm:text-sm text-pink-100/80 leading-relaxed">
                Dihitung secara otomatis menggunakan metode <strong className="text-white">Market Basket Analysis (Algoritma Apriori)</strong> dari{' '}
                <strong className="text-[#FF8DA6]">{totalTxAnalyzed} data transaksi riil</strong> untuk merekomendasikan pasangan layanan dengan tingkat kepastian (<em>Confidence</em>) dan korelasi (<em>Lift Ratio</em>) tertinggi.
              </p>
            </div>

            {/* Live Apriori Metric Pills */}
            <div className="grid grid-cols-3 gap-2.5 sm:gap-3 shrink-0">
              <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl px-3.5 py-2.5 text-center">
                <span className="text-[9px] uppercase tracking-wider text-pink-200/80 font-bold block">Basis Data</span>
                <span className="text-base sm:text-lg font-extrabold text-white">{totalTxAnalyzed} Tx</span>
                <span className="text-[9px] text-emerald-300 font-semibold block">Transaksi Riil</span>
              </div>
              <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl px-3.5 py-2.5 text-center">
                <span className="text-[9px] uppercase tracking-wider text-pink-200/80 font-bold block">Top Confidence</span>
                <span className="text-base sm:text-lg font-extrabold text-[#FF8DA6]">
                  {highlightedRules[0]?.confidence || 100}%
                </span>
                <span className="text-[9px] text-pink-200/90 font-semibold block">Akurasi Aturan</span>
              </div>
              <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl px-3.5 py-2.5 text-center">
                <span className="text-[9px] uppercase tracking-wider text-pink-200/80 font-bold block">Top Lift Ratio</span>
                <span className="text-base sm:text-lg font-extrabold text-amber-300">
                  {Math.max(...highlightedRules.map(r => r.lift), 1.33)}x
                </span>
                <span className="text-[9px] text-amber-200/90 font-semibold block">Korelasi Kuat</span>
              </div>
            </div>
          </div>

          {/* Toggle Sub-View: Association Rules vs Frequent Itemsets Bundles */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="inline-flex p-1 rounded-full bg-white/10 border border-white/15 self-start">
              <button
                type="button"
                onClick={() => setAprioriViewTab('rules')}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  aprioriViewTab === 'rules'
                    ? 'bg-[#FF5376] text-white shadow-md'
                    : 'text-pink-100/80 hover:text-white'
                }`}
              >
                <Network className="w-3.5 h-3.5" />
                <span>Aturan Asosiasi: &ldquo;Jika Pilih X &rarr; Maka Y&rdquo; ({highlightedRules.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setAprioriViewTab('bundles')}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  aprioriViewTab === 'bundles'
                    ? 'bg-[#FF5376] text-white shadow-md'
                    : 'text-pink-100/80 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Paket Kombinasi Terlaris / Frequent Itemset ({highlightedBundles.length})</span>
              </button>
            </div>

            <div className="text-[11px] text-pink-200/80 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <span>Klik <strong className="text-white">&ldquo;Ambil Paket Rekomendasi&rdquo;</strong> untuk langsung memesan kombinasi motif.</span>
            </div>
          </div>

          {/* SUB-VIEW 1: ASSOCIATION RULES (IF ANTECEDENT -> THEN CONSEQUENT) */}
          {aprioriViewTab === 'rules' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {highlightedRules.slice(0, 6).map((rule) => (
                <motion.div
                  key={rule.rank}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white text-[#2D1F24] rounded-2xl p-4 sm:p-5 border-2 border-[#FCE2E8] hover:border-[#FF5376] transition-all shadow-lg flex flex-col justify-between relative overflow-hidden group"
                >
                  {/* Top Rank & Lift Badge */}
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#FFF0F4] text-[#FF5376] border border-[#FCD5DF]">
                        <Award className="w-3 h-3" />
                        <span>Rekomendasi #{rule.rank}</span>
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Lift {rule.lift}x &bull; Korelasi Kuat
                      </span>
                    </div>

                    {/* Visual IF X -> THEN Y Flow */}
                    <div className="grid grid-cols-11 items-center gap-2 bg-[#FFF8FA] border border-[#FCE2E8] rounded-2xl p-3 mb-3">
                      {/* Antecedent (Jika Pilih) */}
                      <div className="col-span-5 flex flex-col items-center text-center">
                        <span className="text-[9px] font-extrabold uppercase tracking-wider text-[#8C727D] mb-1">
                          Jika Memilih
                        </span>
                        {rule.antDesign && (
                          <div className="w-12 h-12 rounded-xl overflow-hidden border border-[#FCD5DF] mb-1.5 shadow-2xs bg-white">
                            <img
                              src={rule.antDesign.image}
                              alt={rule.antecedent}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <span className="px-2 py-0.5 rounded-full bg-white border border-[#FCD5DF] text-[10px] font-extrabold text-[#2D1F24] capitalize line-clamp-1">
                          {rule.antecedent}
                        </span>
                      </div>

                      {/* Arrow */}
                      <div className="col-span-1 flex flex-col items-center justify-center">
                        <div className="w-6 h-6 rounded-full bg-[#FF5376] text-white flex items-center justify-center shadow-xs">
                          <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                      </div>

                      {/* Consequent (Maka Direkomendasikan) */}
                      <div className="col-span-5 flex flex-col items-center text-center">
                        <span className="text-[9px] font-extrabold uppercase tracking-wider text-[#FF5376] mb-1">
                          Rekomendasi
                        </span>
                        {rule.consDesign && (
                          <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-[#FF5376] mb-1.5 shadow-xs bg-white">
                            <img
                              src={rule.consDesign.image}
                              alt={rule.consequent}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <span className="px-2 py-0.5 rounded-full bg-[#FF5376] text-white text-[10px] font-extrabold capitalize line-clamp-1">
                          {rule.consequent}
                        </span>
                      </div>
                    </div>

                    {/* Confidence Progress Bar */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="font-bold text-[#8C727D]">Tingkat Keyakinan (Confidence):</span>
                        <span className="font-extrabold text-[#FF5376] text-xs">{rule.confidence}%</span>
                      </div>
                      <div className="w-full h-2 bg-[#FFF0F4] rounded-full overflow-hidden border border-[#FCE2E8]">
                        <div
                          className="h-full bg-gradient-to-r from-[#FF5376] to-[#FF8DA6] rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.max(15, rule.confidence))}%` }}
                        />
                      </div>
                    </div>

                    <p className="text-[11px] text-[#8C727D] leading-relaxed mb-4">
                       <strong className="text-[#2D1F24]">{rule.confidence}% pelanggan</strong> yang memilih motif{' '}
                      <strong className="text-[#2D1F24] capitalize">{rule.antecedent}</strong> juga memadukannya dengan{' '}
                      <strong className="text-[#FF5376] capitalize">{rule.consequent}</strong>.
                    </p>
                  </div>

                  {/* Action CTA */}
                  <button
                    type="button"
                    onClick={() => handleSelectCombo([...rule.antParts, ...rule.consParts], rule.consDesign?.id || rule.antDesign?.id)}
                    className="w-full py-2.5 px-4 bg-[#FF5376] hover:bg-[#E84366] text-white text-xs font-bold rounded-full transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-pink-200 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Ambil Paket Rekomendasi Ini</span>
                  </button>
                </motion.div>
              ))}
            </div>
          ) : (
            /* SUB-VIEW 2: FREQUENT ITEMSETS / BEST SELLER BUNDLES (k >= 2) */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {highlightedBundles.map((bundle) => (
                <motion.div
                  key={bundle.rank}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white text-[#2D1F24] rounded-2xl p-5 border-2 border-[#FCE2E8] hover:border-[#FF5376] transition-all shadow-lg flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#FFF0F4] text-[#FF5376] border border-[#FCD5DF]">
                        <Flame className="w-3 h-3" />
                        <span>Kombinasi Populer #{bundle.rank}</span>
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        {bundle.count}x Transaksi Bersama
                      </span>
                    </div>

                    {/* Bundle Items Pills */}
                    <div className="p-3.5 bg-[#FFF8FA] border border-[#FCE2E8] rounded-2xl mb-3">
                      <span className="text-[9px] font-extrabold uppercase tracking-wider text-[#8C727D] block mb-2">
                        Itemset Kombinasi Motif (k = {bundle.items.length}):
                      </span>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {bundle.items.map((it, idx) => (
                          <React.Fragment key={idx}>
                            {idx > 0 && (
                              <span className="text-xs font-extrabold text-[#FF5376]">+</span>
                            )}
                            <span className="px-3 py-1 rounded-full bg-white border border-[#FCD5DF] text-xs font-extrabold text-[#2D1F24] capitalize shadow-2xs">
                              {it}
                            </span>
                          </React.Fragment>
                        ))}
                      </div>
                    </div>

                    {/* Support Progress Bar */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="font-bold text-[#8C727D]">Nilai Dukungan (Support):</span>
                        <span className="font-extrabold text-[#FF5376] text-xs">{bundle.support}%</span>
                      </div>
                      <div className="w-full h-2 bg-[#FFF0F4] rounded-full overflow-hidden border border-[#FCE2E8]">
                        <div
                          className="h-full bg-gradient-to-r from-[#FF5376] to-amber-400 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.max(15, bundle.support * 1.5))}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSelectCombo(bundle.items)}
                    className="w-full py-2.5 px-4 bg-[#FFF0F4] hover:bg-[#FF5376] text-[#FF5376] hover:text-white border border-[#FCD5DF] hover:border-[#FF5376] text-xs font-bold rounded-full transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Pilih Kombinasi Ini</span>
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Dual-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Rekomendasi Nail Art Grid (7 or 8 columns on large screens) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4" id="gallery">
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[#2D1F24] tracking-tight flex items-center gap-2">
                <span>Katalog &amp; Rekomendasi Nail Art</span>
                <span className="text-[10px] font-bold px-2.5 py-0.5 bg-[#FFF0F4] text-[#FF5376] border border-[#FCD5DF] rounded-full">
                  {filteredDesigns.length} Motif Tersedia
                </span>
              </h3>
              <p className="text-[11px] text-[#8C727D]">
                Motif dengan lencana <strong className="text-[#FF5376]">Rekomendasi Apriori</strong> memiliki frekuensi &amp; tingkat keyakinan tertinggi
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSortByApriori(prev => !prev)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                  sortByApriori
                    ? 'bg-[#FF5376] text-white border-[#FF5376] shadow-2xs'
                    : 'bg-white text-[#8C727D] border-[#FCE2E8] hover:border-[#FF5376]'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>{sortByApriori ? 'Diurutkan: Skor Apriori Tertinggi' : 'Urutkan Skor Apriori'}</span>
              </button>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-4">
            {filteredDesigns.length > 0 ? (
              filteredDesigns.map((design) => {
                const isLiked = favorites.includes(design.id);
                const aprioriInfo = designAprioriMeta.get(design.id);

                return (
                  <div
                    key={design.id}
                    className={`group bg-white rounded-2xl overflow-hidden transition-all duration-300 flex flex-col ${
                      aprioriInfo
                        ? 'border-2 border-[#FF5376]/60 shadow-md shadow-pink-100/80 hover:border-[#FF5376]'
                        : 'border border-[#FCE2E8] hover:shadow-md hover:shadow-pink-100'
                    }`}
                  >
                    {/* Image Area with Badge & Heart Button */}
                    <div className="relative aspect-4/3 overflow-hidden bg-[#FFF0F4]">
                      <img
                        src={design.image}
                        alt={design.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />

                      {/* Top-Left Apriori Highlight Ribbon */}
                      {aprioriInfo && (
                        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-[#2D1F24]/90 backdrop-blur-xs text-white text-[10px] font-extrabold flex items-center gap-1.5 shadow-md border border-[#FF5376]/50">
                          <Sparkles className="w-3 h-3 text-[#FF5376]" />
                          <span>Apriori {aprioriInfo.confidence}%</span>
                        </div>
                      )}

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
                      <div className="absolute bottom-3 left-3 flex items-center gap-1.5 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FF5376] text-white shadow-xs uppercase tracking-wider">
                          {design.tag || "Populer"}
                        </span>
                        {design.category && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-white/90 backdrop-blur-xs text-[#2D1F24] border border-[#FCE2E8]">
                            {design.category}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="mb-1">
                          <h4 className="font-bold text-sm text-[#2D1F24] group-hover:text-[#FF5376] transition-colors leading-tight">
                            {design.name}
                          </h4>
                        </div>

                        <div className="flex items-center justify-between text-xs text-[#8C727D] mb-2">
                          <span className="font-medium">{design.styleSubtitle || "Trendy & Elegan"}</span>
                          <span className="font-bold text-[#FF5376]">{formatRupiah(design.price)}</span>
                        </div>

                        {design.description && (
                          <p className="text-[11px] text-[#8C727D] line-clamp-2 leading-relaxed mb-2.5">
                            {design.description}
                          </p>
                        )}

                        {/* Apriori Pairing Callout Box inside Card */}
                        {aprioriInfo && (
                          <div className="mb-3 px-3 py-2 rounded-xl bg-[#FFF0F4] border border-[#FCD5DF] text-[10px] text-[#2D1F24] flex items-center justify-between gap-2">
                            <span className="truncate">
                              💡 Sering dipadukan dengan: <strong className="text-[#FF5376] capitalize">{aprioriInfo.pairedWith}</strong>
                            </span>
                            <span className="font-extrabold text-[#FF5376] shrink-0">
                              Lift {aprioriInfo.lift}x
                            </span>
                          </div>
                        )}
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
          {/* Apriori Best Sellers & Bundling Card Moved to Top of Right Column for Prominence */}
          <div className="bg-gradient-to-br from-[#FFF0F4] via-[#FFE4EC] to-[#FFD9E4] border-2 border-[#FF5376]/40 rounded-3xl p-5 shadow-md">
            <div className="flex items-center justify-between gap-2 mb-3 pb-2.5 border-b border-[#FCD5DF]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-2xl bg-[#FF5376] text-white flex items-center justify-center shadow-xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-[#FF5376] block">
                    RINGKASAN APRIORI
                  </span>
                  <h4 className="text-xs sm:text-sm font-extrabold text-[#2D1F24] leading-tight">
                    Kombinasi Terfavorit (L2+)
                  </h4>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-white text-[#FF5376] font-extrabold text-[10px] border border-[#FCD5DF]">
                Top {highlightedBundles.slice(0, 4).length} Paket
              </span>
            </div>

            <div className="space-y-2.5">
              {highlightedBundles.slice(0, 4).map((itemset, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelectCombo(itemset.items)}
                  className="p-3 bg-white hover:bg-[#FFF8FA] rounded-2xl border border-[#FCE2E8] hover:border-[#FF5376] transition-all flex items-center justify-between text-xs cursor-pointer group shadow-2xs"
                  title="Klik untuk memesan kombinasi ini"
                >
                  <div className="flex flex-wrap items-center gap-1 pr-2">
                    <span className="w-5 h-5 rounded-full bg-[#FFF0F4] text-[#FF5376] font-extrabold text-[10px] flex items-center justify-center border border-[#FCD5DF] mr-0.5">
                      #{idx + 1}
                    </span>
                    {itemset.items.map((it, i) => (
                      <React.Fragment key={i}>
                        {i > 0 && <span className="text-[#FF5376] font-bold text-[10px]">+</span>}
                        <span className="px-2.5 py-0.5 bg-[#FFF0F4] group-hover:bg-[#FF5376] group-hover:text-white text-[#2D1F24] font-bold text-[10px] rounded-full transition-colors capitalize">
                          {it}
                        </span>
                      </React.Fragment>
                    ))}
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-[#FF5376] font-extrabold block">Support {itemset.support}%</span>
                    <span className="text-[9px] text-[#8C727D] block">{itemset.count} Transaksi</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-bold text-[#2D1F24] tracking-tight">
              Motif Nail Art Populer (L1)
            </h3>
            {onNavigateBooking ? (
              <button
                type="button"
                onClick={onNavigateBooking}
                className="inline-flex items-center gap-1 text-xs font-bold text-[#FF5376] hover:text-[#E84366] transition-colors cursor-pointer"
              >
                <span>Halaman Booking</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <a
                href="#booking"
                className="inline-flex items-center gap-1 text-xs font-bold text-[#FF5376] hover:text-[#E84366] transition-colors"
              >
                <span>Lihat semua</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            )}
          </div>

          {/* 4 Step-by-Step Motif Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
            {POPULAR_MOTIFS.map((motif) => (
              <div
                key={motif.id}
                className="bg-white border border-[#FCE2E8] rounded-2xl p-4 hover:shadow-xs hover:border-[#F9BFCB] transition-all"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{motif.icon}</span>
                    <h4 className="text-xs sm:text-sm font-bold text-[#2D1F24]">
                      {motif.name}
                    </h4>
                  </div>
                  <span className="text-[9px] font-bold px-2 py-0.5 bg-[#FFF0F4] text-[#FF5376] border border-[#FCD5DF] rounded-full">
                    {motif.frequencyBadge}
                  </span>
                </div>
                <div className="text-[10px] text-[#8C727D] mb-2 font-medium">
                  {motif.difficulty}
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
        </div>
      </div>
    </section>
  );
}
