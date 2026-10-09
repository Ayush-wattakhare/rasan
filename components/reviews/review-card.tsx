'use client';

import { Card, CardContent } from '@/components/ui/card';
import { formatDistanceToNow } from '@/lib/utils/format';
import StarRating from './star-rating';

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  user?: {
    name: string;
    avatar_url: string | null;
  };
}

interface ReviewCardProps {
  review: Review;
}

export default function ReviewCard({ review }: ReviewCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            {review.user?.avatar_url ? (
              <img
                src={review.user.avatar_url}
                alt={review.user.name}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <span className="text-lg">👤</span>
            )}
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold">{review.user?.name || 'Anonymous'}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(review.created_at)}
                </p>
              </div>
              <StarRating rating={review.rating} readonly />
            </div>
            {review.comment && (
              <p className="text-sm text-muted-foreground">{review.comment}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
