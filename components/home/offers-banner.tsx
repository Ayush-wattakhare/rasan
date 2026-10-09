'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Tag, Percent } from 'lucide-react';

const offers = [
  {
    id: 1,
    title: '50% OFF up to ₹100',
    subtitle: 'Use code HOMELY50',
    description: 'Valid on orders above ₹199',
    color: 'from-purple-500 to-purple-600',
    icon: Percent,
  },
  {
    id: 2,
    title: 'Free Delivery',
    subtitle: 'On orders above ₹299',
    description: 'No code required',
    color: 'from-green-500 to-green-600',
    icon: Tag,
  },
  {
    id: 3,
    title: 'Flat ₹150 OFF',
    subtitle: 'Use code FEAST150',
    description: 'Valid on orders above ₹499',
    color: 'from-orange-500 to-orange-600',
    icon: Percent,
  },
];

export default function OffersBanner() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % offers.length);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + offers.length) % offers.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % offers.length);
  };

  const currentOffer = offers[currentIndex];
  const Icon = currentOffer.icon;

  return (
    <section className="py-8 md:py-12 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-text-primary">
            Offers for You
          </h2>
        </div>

        <div className="relative">
          <div className={`bg-gradient-to-r ${currentOffer.color} rounded-2xl p-6 md:p-8 text-white shadow-lg`}>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-2xl md:text-3xl font-bold">{currentOffer.title}</h3>
                    <p className="text-sm md:text-base opacity-90">{currentOffer.subtitle}</p>
                  </div>
                </div>
                <p className="text-sm opacity-80 mt-2">{currentOffer.description}</p>
              </div>

              <div className="hidden md:flex gap-2 ml-4">
                <button
                  onClick={goToPrevious}
                  className="p-2 bg-white/20 hover:bg-white/30 rounded-full smooth-transition"
                  aria-label="Previous offer"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={goToNext}
                  className="p-2 bg-white/20 hover:bg-white/30 rounded-full smooth-transition"
                  aria-label="Next offer"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Dots Indicator */}
            <div className="flex justify-center gap-2 mt-4">
              {offers.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-2 h-2 rounded-full smooth-transition ${
                    index === currentIndex ? 'bg-white w-6' : 'bg-white/50'
                  }`}
                  aria-label={`Go to offer ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
