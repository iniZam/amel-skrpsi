import React from 'react';
import { Heart, Palette, BookOpen, Sparkles } from 'lucide-react';

export default function FeatureBar() {
  const features = [
    {
      icon: Heart,
      title: "Rekomendasi Personal",
      desc: "Sesuai preferensi & gayamu"
    },
    {
      icon: Palette,
      title: "Beragam Motif",
      desc: "Ratusan pilihan motif terbaru"
    },
    {
      icon: BookOpen,
      title: "Tutorial Mudah",
      desc: "Langkah mudah diikuti"
    },
    {
      icon: Sparkles,
      title: "Tren Terupdate",
      desc: "Selalu update setiap minggu"
    }
  ];

  return (
    <section className="py-6 px-4 max-w-7xl mx-auto" id="features">
      <div className="bg-[#FFF0F4] border border-[#FCD5DF] rounded-2xl p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
        {features.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-full bg-[#FF5376] text-white flex items-center justify-center shrink-0 shadow-xs shadow-pink-200">
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-[#2D1F24] leading-tight">
                  {item.title}
                </h4>
                <p className="text-[10px] sm:text-[11px] text-[#8C727D] leading-tight mt-0.5">
                  {item.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
