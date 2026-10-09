'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ReviewList from './review-list';
import ReviewForm from './review-form';

interface ReviewSectionProps {
  mealId: string;
  userId?: string;
  canReview?: boolean;
}

export default function ReviewSection({ mealId, userId, canReview = false }: ReviewSectionProps) {
  const [showForm, setShowForm] = useState(false);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Reviews & Ratings</CardTitle>
          {canReview && userId && (
            <Button onClick={() => setShowForm(!showForm)}>
              {showForm ? 'Cancel' : 'Write a Review'}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {showForm && userId && (
          <ReviewForm
            mealId={mealId}
            userId={userId}
            onSuccess={() => setShowForm(false)}
          />
        )}
        <ReviewList mealId={mealId} />
      </CardContent>
    </Card>
  );
}
