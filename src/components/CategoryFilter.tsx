import React from 'react';
import {
  LayoutGrid,
  Sparkles,
  Diamond,
  Heart,
  Star,
  Palette,
  SlidersHorizontal,
  Crown
} from 'lucide-react';

interface CategoryFilterProps {
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  onToggleFilterModal?: () => void;
}

export const CATEGORIES = [
  { id: 'Semua', label: 'Semua', icon: LayoutGrid },
  { id: 'Minimalis', label: 'Minimalis', icon: Sparkles },
  { id: 'Elegant', label: 'Elegant', icon: Diamond },
  { id: 'Cute', label: 'Cute', icon: Heart },
  { id: 'Korea Style', label: 'Korea Style', icon: Star },
  { id: 'Colorful', label: 'Colorful', icon: Palette },
  { id: 'Glitter', label: 'Glitter', icon: Sparkles },
  { id: 'Classic', label: 'Classic', icon: Crown },
];

export default function CategoryFilter({
  selectedCategory,
  onSelectCategory,
  onToggleFilterModal
}: CategoryFilterProps) {
  return (
    <section className="pt-6 pb-2 px-4 max-w-7xl mx-auto text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h2 className="text-base sm:text-lg font-bold text-[#2D1F24] tracking-tight">
          Pilih Sesuai Gayamu
        </h2>
      </div>

      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2 scrollbar-none">
        {/* Category Pills List */}
        <div className="flex items-center gap-2 shrink-0">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer shadow-2xs whitespace-nowrap ${
                  isSelected
                    ? 'bg-[#FF5376] text-white shadow-pink-200'
                    : 'bg-white border border-[#FCE2E8] text-[#8C727D] hover:bg-[#FFF0F4] hover:text-[#2D1F24]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-[#B59BA6]'}`} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Filter Trigger Button on Right */}
        <button
          onClick={onToggleFilterModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-white border border-[#FCE2E8] text-[#8C727D] hover:bg-[#FFF0F4] hover:text-[#2D1F24] transition-all shrink-0 cursor-pointer shadow-2xs"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-[#B59BA6]" />
          <span>Filter</span>
        </button>
      </div>
    </section>
  );
}
