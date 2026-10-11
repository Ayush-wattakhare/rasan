'use client';

import { useEffect, useState } from 'react';
import ReviewCard from './review-card';

interface Review {
  id: string;
  user_id: string;
  meal_id: string;
  order_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  user?: {
    name: string;
    avatar_url: string | null;
  };
}

interface ReviewListProps {
  mealId: string;
}

export default function ReviewList({ mealId }: ReviewListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await fetch(`/api/meals/${mealId}/reviews`);
        if (res.ok) {
          const data = await res.json();
          setReviews(data.reviews || []);
          setAverageRating(data.averageRating || 0);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [mealId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-muted-foreground">Loading reviews...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.length > 0 && (
        <div className="flex items-center gap-4 pb-4 border-b">
          <div className="text-center">
            <div className="text-4xl font-bold">{averageRating.toFixed(1)}</div>
            <div className="text-sm text-muted-foreground">
              {reviews.length} review{reviews.length !== 1 ? 's' : ''}
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-1 text-2xl">
              {[1, 2, 3, 4, 5].map((star) => (
                <span key={star} className={star <= Math.round(averageRating) ? 'text-yellow-500' : 'text-gray-300'}>
                  ⭐
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {reviews.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No reviews yet. Be the first to review!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}
    </div>
  );
}
