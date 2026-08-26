import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Heart, HelpCircle } from 'lucide-react';
import { NailDesign, RecommendationData } from '../types';

interface GallerySectionProps {
  designs: NailDesign[];
  recommendations: RecommendationData | null;
  onSelectService: (serviceId: string) => void;
}

export default function GallerySection({ designs, recommendations, onSelectService }: GallerySectionProps) {
  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <section className="py-16 px-4 max-w-7xl mx-auto text-left" id="gallery">
      {/* Gallery Header */}
      <div className="text-center mb-16">
        <span className="text-art-stone font-mono text-xs tracking-[0.25em] uppercase block">Gaya & Seni Kuku Premium</span>
        <h2 className="text-4xl md:text-5xl font-serif mt-3 text-art-text tracking-tight uppercase">
          Galeri Desain Kuku Kami
        </h2>
        <div className="w-16 h-[1px] bg-art-gold mx-auto my-4" />
        <p className="text-art-muted mt-4 max-w-2xl mx-auto text-sm leading-relaxed">
          Jelajahi koleksi mahakarya seni kuku eksklusif kami. Klik desain favorit Anda untuk menambahkan ke rencana perawatan dan memesan jadwal Anda secara real-time.
        </p>
      </div>

      {/* Grid Desain Kuku */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mb-24">
        {designs.map((design, index) => (
          <motion.div
            key={design.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.05 }}
            className="group relative bg-white border border-art-border rounded-none overflow-hidden transition-all duration-300 flex flex-col h-full"
          >
            {/* Offset Gold Border on Hover */}
            <div className="absolute inset-0 border border-transparent group-hover:border-art-gold group-hover:-m-1.5 transition-all duration-300 z-0 pointer-events-none" />

            {/* Image Container with Referrer Policy */}
            <div className="relative aspect-square overflow-hidden bg-art-light z-10">
              <img
                src={design.image}
                alt={design.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute top-4 right-4 bg-white border border-art-border py-1 px-3 text-[10px] font-bold text-art-text uppercase tracking-widest shadow-2xs">
                {formatRupiah(design.price)}
              </div>
            </div>

            {/* Content Info */}
            <div className="p-5 flex-1 flex flex-col justify-between z-10 bg-white">
              <div className="mb-4">
                <h3 className="font-serif text-lg text-art-text font-bold mb-1 group-hover:text-art-gold transition-colors">
                  {design.name}
                </h3>
                <p className="text-art-muted text-[11px] leading-relaxed line-clamp-2">
                  {design.description}
                </p>
              </div>

              <button
                id={`btn-select-${design.id}`}
                onClick={() => onSelectService(design.id)}
                className="w-full py-3 px-4 bg-art-dark hover:bg-art-gold text-white text-[10px] font-bold tracking-widest uppercase rounded-none transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-white" />
                Pilih Layanan
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Roda Rekomendasi Apriori */}
      <div className="bg-[#F9F7F4] border border-art-border rounded-none p-8 lg:p-12 mb-16 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-art-gold/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-art-gold/5 rounded-full blur-3xl" />

        <div className="relative">
          {/* Section Header */}
          <div className="flex flex-col items-center text-center mb-10">
            <div className="bg-art-light border border-art-border py-2 px-4 text-art-gold mb-3 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 animate-pulse" />
              <span className="text-[10px] font-mono tracking-widest uppercase font-bold">Rekomendasi Pintar Apriori</span>
            </div>
            <h3 className="text-2xl md:text-3xl font-serif text-art-text tracking-tight uppercase">
              Paduan Desain Terpopuler Hari Ini
            </h3>
            <p className="text-art-muted text-xs mt-2 max-w-xl">
              Asisten kecerdasan buatan kami menganalisis riwayat transaksi ribuan pelanggan secara berkala untuk merekomendasikan kombinasi desain yang paling serasi.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-left">
            {/* Best Sellers (Frequent Itemsets) */}
            <div className="bg-white border border-art-border rounded-none p-6">
              <h4 className="font-serif text-base text-art-text font-bold uppercase tracking-wide mb-6 pb-2 border-b border-art-border flex items-center gap-2">
                <span className="text-art-gold font-mono text-sm">#1</span> Kombinasi Terlaris (Best Seller)
              </h4>

              {recommendations && recommendations.bestSellers.length > 0 ? (
                <div className="space-y-4">
                  {recommendations.bestSellers.map((itemset, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 bg-art-light border border-art-border rounded-none flex items-center justify-between hover:bg-white transition-colors"
                    >
                      <div className="flex flex-wrap items-center gap-2 pr-2">
                        {itemset.items.map((item, itemIdx) => (
                          <React.Fragment key={itemIdx}>
                            {itemIdx > 0 && <span className="text-art-stone font-light text-xs">&amp;</span>}
                            <span className="px-2.5 py-1 bg-white border border-art-border text-[10px] text-art-text font-bold uppercase tracking-wider">
                              {item.replace(/_/g, ' ')}
                            </span>
                          </React.Fragment>
                        ))}
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-art-stone text-[9px] font-mono block uppercase">POPULARITAS</span>
                        <span className="text-xs font-bold text-art-text">{itemset.support}%</span>
                        <span className="text-[9px] text-art-stone block">({itemset.count} Transaksi)</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-48 flex flex-col items-center justify-center text-center text-art-stone">
                  <Heart className="w-8 h-8 mb-2 text-art-border stroke-1" />
                  <p className="text-xs">Belum ada pola transaksi yang cukup kuat.</p>
                  <span className="text-[10px] mt-1 text-art-stone">Kumpulkan lebih banyak data transaksi terlebih dahulu!</span>
                </div>
              )}
            </div>

            {/* Smart Bundles (Association Rules) */}
            <div className="bg-white border border-art-border rounded-none p-6">
              <h4 className="font-serif text-base text-art-text font-bold uppercase tracking-wide mb-6 pb-2 border-b border-art-border flex items-center gap-2">
                <span className="text-art-gold font-mono text-sm">#2</span> Rekomendasi Bundling Pintar
              </h4>

              {recommendations && recommendations.recommendations.length > 0 ? (
                <div className="space-y-4">
                  {recommendations.recommendations.map((rule, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-white border-l-2 border-art-gold border-y border-r border-art-border hover:bg-art-light transition-colors rounded-none"
                    >
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold">
                          <span className="text-art-text px-2 py-0.5 bg-art-light border border-art-border uppercase tracking-wider">
                            {rule.antecedent.replace(/_/g, ' ')}
                          </span>
                          <span className="text-art-gold text-xs font-semibold">&rarr;</span>
                          <span className="text-art-text px-2 py-0.5 bg-art-light border border-art-border uppercase tracking-wider">
                            {rule.consequent.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-[9px] font-mono text-art-gold block uppercase tracking-wider">CONFIDENCE</span>
                          <span className="text-xs font-bold text-art-text">{rule.confidence}%</span>
                        </div>
                      </div>

                      <p className="text-art-muted text-[10px] leading-relaxed">
                        Pelanggan yang memesan <span className="font-semibold text-art-text">{rule.antecedent.replace(/_/g, ' ')}</span> cenderung <span className="font-bold text-art-gold">{rule.confidence}%</span> memesan juga <span className="font-semibold text-art-text">{rule.consequent.replace(/_/g, ' ')}</span> (Lift: <span className="font-bold">{rule.lift}x</span>).
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-48 flex flex-col items-center justify-center text-center text-art-stone">
                  <HelpCircle className="w-8 h-8 mb-2 text-art-border stroke-1" />
                  <p className="text-xs">Aturan asosiasi relasi belum terbentuk.</p>
                  <span className="text-[10px] mt-1 text-art-stone">Min. support atau confidence mungkin terlalu tinggi untuk sebaran transaksi saat ini.</span>
                </div>
              )}
            </div>
          </div>

          {/* Autotraining info banner */}
          <div className="mt-8 p-4 bg-art-dark text-white rounded-none text-center flex flex-col sm:flex-row items-center justify-center gap-2 text-xs font-mono tracking-widest uppercase">
            <span>🔄 <strong>Sistem Rekomendasi Ter-update Otomatis:</strong></span>
            <span>Retraining berjalan otomatis setiap ada <strong>20 transaksi baru</strong>.</span>
            {recommendations && (
              <span className="text-art-gold font-bold">({recommendations.newTransactionsCount}/20 Transaksi Baru)</span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
