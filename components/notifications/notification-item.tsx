'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from '@/lib/utils/format';
import type { Notification } from '@/lib/supabase/types';

interface NotificationItemProps {
  notification: Notification;
}

export default function NotificationItem({ notification }: NotificationItemProps) {
  const [isRead, setIsRead] = useState(notification.is_read);

  const markAsRead = async () => {
    if (isRead) return;
    setIsRead(true);

    try {
      await fetch(`/api/notifications/${notification.id}/read`, {
        method: 'POST',
      });
    } catch (err) {
      console.warn('Error marking notification read:', err);
    }
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      order: '📦',
      payment: '💳',
      delivery: '🚚',
      subscription: '🔄',
      system: '⚙️',
    };
    return icons[type] || '📬';
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      order: 'bg-blue-50 text-blue-700 border-blue-200',
      payment: 'bg-green-50 text-green-700 border-green-200',
      delivery: 'bg-purple-50 text-purple-700 border-purple-200',
      subscription: 'bg-orange-50 text-orange-700 border-orange-200',
      system: 'bg-gray-50 text-gray-700 border-gray-200',
    };
    return colors[type] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  return (
    <Card
      className={`cursor-pointer transition-all duration-200 rounded-2xl border ${
        !isRead
          ? 'bg-orange-50/40 border-orange-200/80 shadow-xs'
          : 'bg-white hover:bg-gray-50/60 border-gray-100 shadow-none'
      }`}
      onClick={markAsRead}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-xl shadow-xs shrink-0">
            {getTypeIcon(notification.type)}
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-start justify-between gap-2">
              <h4 className={`text-sm font-bold ${!isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                {notification.title}
              </h4>
              {!isRead && (
                <span className="h-2 w-2 rounded-full bg-orange-500 flex-shrink-0 mt-1.5 animate-pulse" />
              )}
            </div>
            <p className="text-xs text-gray-600 font-medium leading-relaxed">{notification.message}</p>
            <div className="flex items-center gap-2 pt-1">
              <Badge className={`text-[0.6rem] font-bold uppercase tracking-wider ${getTypeColor(notification.type)}`} variant="outline">
                {notification.type}
              </Badge>
              <span className="text-[0.65rem] text-gray-400 font-medium">
                {formatDistanceToNow(notification.created_at)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
