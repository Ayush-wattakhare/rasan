'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export default function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
  footer,
}: BottomSheetProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 animate-in fade-in"
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-2xl shadow-2xl animate-in slide-in-from-bottom max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-text-primary">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full smooth-transition"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-text-secondary" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="p-4 border-t border-gray-100 bg-white">
            {footer}
          </div>
        )}
      </div>
    </>
  );
}

// Example usage component
export function FilterBottomSheet({
  isOpen,
  onClose,
  onApply,
}: {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: any) => void;
}) {
  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Filters"
      footer={
        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Clear All
          </Button>
          <Button onClick={() => onApply({})} className="flex-1">
            Apply Filters
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Sort By */}
        <div>
          <h3 className="font-semibold text-text-primary mb-3">Sort By</h3>
          <div className="space-y-2">
            {['Relevance', 'Rating', 'Delivery Time', 'Cost: Low to High', 'Cost: High to Low'].map((option) => (
              <label key={option} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:border-primary smooth-transition">
                <input type="radio" name="sort" className="w-4 h-4 text-primary" />
                <span className="text-sm text-text-primary">{option}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Dietary Preference */}
        <div>
          <h3 className="font-semibold text-text-primary mb-3">Dietary Preference</h3>
          <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:border-primary smooth-transition">
            <input type="checkbox" className="w-4 h-4 text-primary rounded" />
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-green-600 bg-white flex items-center justify-center rounded-sm">
                <div className="w-2 h-2 rounded-full bg-green-600"></div>
              </div>
              <span className="text-sm text-text-primary">Vegetarian Only</span>
            </div>
          </label>
        </div>

        {/* Rating */}
        <div>
          <h3 className="font-semibold text-text-primary mb-3">Rating</h3>
          <div className="space-y-2">
            {['4.5+', '4.0+', '3.5+', '3.0+'].map((rating) => (
              <label key={rating} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:border-primary smooth-transition">
                <input type="radio" name="rating" className="w-4 h-4 text-primary" />
                <span className="text-sm text-text-primary">⭐ {rating}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Price Range */}
        <div>
          <h3 className="font-semibold text-text-primary mb-3">Price Range</h3>
          <div className="space-y-2">
            {['Under ₹200', '₹200 - ₹500', 'Above ₹500'].map((range) => (
              <label key={range} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:border-primary smooth-transition">
                <input type="checkbox" className="w-4 h-4 text-primary rounded" />
                <span className="text-sm text-text-primary">{range}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </BottomSheet>
  );
}
