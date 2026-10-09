'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Star, X, CheckCircle2, Loader2, Heart, Award } from 'lucide-react';
import { useToast } from '@/lib/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface OrderRatingModalProps {
  orderId: string;
  vendorId: string;
  vendorName?: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function OrderRatingModal({
  orderId,
  vendorId,
  vendorName,
  isOpen,
  onClose,
}: OrderRatingModalProps) {
  const [mounted, setMounted] = useState(false);
  const [vendorRating, setVendorRating] = useState(5);
  const [foodRating, setFoodRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const handleSubmitRating = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          vendorId,
          rating: vendorRating,
          foodRating,
          comment: comment.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit rating');
      }

      setSubmitted(true);
      toast({
        title: 'Review Submitted! ⭐',
        description: 'Thank you! Your feedback helps top chefs grow.',
      });
      router.refresh();
    } catch (err: any) {
      toast({
        title: 'Submission Error',
        description: err.message || 'Could not save review',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-[2.5rem] max-w-md w-full p-6 sm:p-8 shadow-2xl relative border border-gray-100 max-h-[85vh] overflow-y-auto my-auto animate-in zoom-in-95 duration-300">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition"
        >
          <X className="w-4 h-4" />
        </button>

        {submitted ? (
          <div className="text-center space-y-6 py-6">
            <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto text-amber-500">
              <Award className="w-8 h-8 animate-bounce" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-gray-900 uppercase italic">Rating Submitted!</h3>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider max-w-xs mx-auto">
                Your rating updated {vendorName || 'the kitchen'}&apos;s overall score!
              </p>
            </div>
            <Button
              onClick={onClose}
              className="w-full bg-orange-600 hover:bg-orange-500 text-white font-black uppercase tracking-widest h-12 rounded-xl"
            >
              Done
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmitRating} className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="bg-amber-100 p-3 rounded-2xl text-amber-600">
                <Star className="w-6 h-6 fill-amber-500" />
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-900 tracking-tight">Rate Your Meal</h3>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                  {vendorName || 'Kitchen Partnership Review'}
                </p>
              </div>
            </div>

            {/* Food Taste Star Selection */}
            <div className="space-y-2 bg-amber-50/50 p-4 rounded-2xl border border-amber-100">
              <label className="text-xs font-black uppercase tracking-wider text-gray-700 block">
                Food Quality & Taste
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFoodRating(star)}
                    className="p-1 hover:scale-125 transition-transform"
                  >
                    <Star
                      className={`w-7 h-7 ${
                        star <= foodRating
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
                <span className="text-sm font-black text-amber-600 ml-2">{foodRating} / 5</span>
              </div>
            </div>

            {/* Vendor Service Star Selection */}
            <div className="space-y-2 bg-orange-50/50 p-4 rounded-2xl border border-orange-100">
              <label className="text-xs font-black uppercase tracking-wider text-gray-700 block">
                Overall Kitchen & Service Rating
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setVendorRating(star)}
                    className="p-1 hover:scale-125 transition-transform"
                  >
                    <Star
                      className={`w-7 h-7 ${
                        star <= vendorRating
                          ? 'fill-orange-500 text-orange-500'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
                <span className="text-sm font-black text-orange-600 ml-2">{vendorRating} / 5</span>
              </div>
            </div>

            {/* Feedback text */}
            <div>
              <label className="text-xs font-black uppercase tracking-wider text-gray-400">Written Review (Optional)</label>
              <textarea
                rows={3}
                placeholder="Share details about flavor, packaging, or freshness..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full mt-1.5 p-3 text-sm font-semibold bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                disabled={loading}
                className="flex-1 rounded-xl text-xs font-bold uppercase tracking-wider text-gray-500"
              >
                Skip
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-orange-600 hover:bg-orange-500 text-white font-black rounded-xl text-xs uppercase tracking-wider shadow-lg"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Submit Rating'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
}
