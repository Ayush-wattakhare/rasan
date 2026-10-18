'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';
import type { Notification } from '@/lib/supabase/types';

interface NotificationBellProps {
  userId: string;
}

export default function NotificationBell({ userId }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    // The badge counts every unread notification, not just the 5 shown.
    const refreshUnreadCount = async () => {
      const { count } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);
      if (active && typeof count === 'number') setUnreadCount(count);
    };

    const fetchNotifications = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (active && data) setNotifications(data);
      await refreshUnreadCount();
      if (active) setLoading(false);
    };

    fetchNotifications();

    const channel = supabase
      .channel(`notification-bell-${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications((prev) => [newNotification, ...prev.slice(0, 4)]);
          refreshUnreadCount();
        }
      )
      .on(
        'postgres_changes',
        // Marking read on /notifications (or another tab) updates the badge too.
        { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => {
          const updated = payload.new as Notification;
          setNotifications((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
          refreshUnreadCount();
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const markAsRead = async (notificationId: string) => {
    const res = await fetch(`/api/notifications/${notificationId}/read`, { method: 'POST' }).catch(
      () => null
    );
    // Only change the badge once the server has saved it.
    if (!res?.ok) return;

    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative hidden md:flex">
          <span className="text-xl">🔔</span>
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {loading ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Loading...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No notifications
          </div>
        ) : (
          <>
            {notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className="flex flex-col items-start gap-1 p-3"
                onClick={() => !notification.is_read && markAsRead(notification.id)}
              >
                <div className="flex w-full items-start justify-between">
                  <span className="font-medium">{notification.title}</span>
                  {!notification.is_read && (
                    <span className="h-2 w-2 rounded-full bg-primary" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {notification.message}
                </p>
                <span className="text-xs text-muted-foreground">
                  {formatTime(notification.created_at)}
                </span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/notifications" className="text-center">
                View all notifications
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
