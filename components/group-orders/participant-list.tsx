'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User } from 'lucide-react';

interface ParticipantListProps {
  participants: any[];
  currentUserId: string;
}

export default function ParticipantList({
  participants,
  currentUserId,
}: ParticipantListProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  if (participants.length === 0) {
    return (
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Participants</h2>
        <p className="text-muted-foreground text-center py-8">
          No participants yet. Share the link to invite others!
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">
        Participants ({participants.length})
      </h2>

      <div className="space-y-3">
        {participants.map((participant: any, index: number) => {
          const isCurrentUser = participant.user_id === currentUserId;
          const itemCount = participant.items?.length || 0;

          return (
            <div
              key={index}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">
                      Participant {index + 1}
                      {isCurrentUser && ' (You)'}
                    </p>
                    {isCurrentUser && (
                      <Badge variant="secondary" className="text-xs">
                        You
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {itemCount} {itemCount === 1 ? 'item' : 'items'}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className="font-semibold text-green-600">
                  {formatCurrency(participant.contribution)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
