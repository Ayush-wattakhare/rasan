'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef } from 'react';

const categories = [
  { id: 'biryani', name: 'Biryani', emoji: '🍛', color: 'from-orange-100 to-orange-50' },
  { id: 'pizza', name: 'Pizza', emoji: '🍕', color: 'from-red-100 to-red-50' },
  { id: 'burger', name: 'Burgers', emoji: '🍔', color: 'from-yellow-100 to-yellow-50' },
  { id: 'chinese', name: 'Chinese', emoji: '🥡', color: 'from-pink-100 to-pink-50' },
  { id: 'south-indian', name: 'South Indian', emoji: '🥘', color: 'from-green-100 to-green-50' },
  { id: 'north-indian', name: 'North Indian', emoji: '🍲', color: 'from-amber-100 to-amber-50' },
  { id: 'desserts', name: 'Desserts', emoji: '🍰', color: 'from-purple-100 to-purple-50' },
  { id: 'beverages', name: 'Beverages', emoji: '🥤', color: 'from-blue-100 to-blue-50' },
  { id: 'healthy', name: 'Healthy', emoji: '🥗', color: 'from-lime-100 to-lime-50' },
  { id: 'fast-food', name: 'Fast Food', emoji: '🌭', color: 'from-rose-100 to-rose-50' },
];

export default function CategoryCarousel() {
  const router = useRouter();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const handleCategoryClick = (categoryId: string) => {
    router.push(`/meals?category=${categoryId}`);
  };

  return (
    <section className="py-8 md:py-12 bg-white border-b border-gray-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-text-primary">
            What's on your mind?
          </h2>
          <div className="hidden md:flex gap-2">
            <button
              onClick={() => scroll('left')}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 smooth-transition"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-5 h-5 text-text-primary" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 smooth-transition"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-5 h-5 text-text-primary" />
            </button>
          </div>
        </div>

        <div
          ref={scrollContainerRef}
          className="flex gap-6 md:gap-8 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategoryClick(category.id)}
              className="flex flex-col items-center gap-2 shrink-0 group"
            >
              <div className={`w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br ${category.color} flex items-center justify-center text-3xl md:text-4xl group-hover:scale-110 smooth-transition shadow-sm`}>
                {category.emoji}
              </div>
              <span className="text-xs md:text-sm font-medium text-text-secondary group-hover:text-primary smooth-transition">
                {category.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
}
