import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import NotificationList from '@/components/notifications/notification-list';
import { Bell, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Notifications | Rasan Home Tiffins',
  description: 'View your live order updates, kitchen notifications, and subscription alerts.',
};

export default async function NotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/notifications');
  }

  return (
    <div className="min-h-screen bg-[#FDFCFB] py-10 md:py-16">
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Header */}
        <div className="mb-8 space-y-4">
          <Link href="/">
            <Button
              variant="ghost"
              className="p-0 hover:bg-transparent text-gray-400 hover:text-orange-600 font-bold uppercase tracking-widest text-[0.65rem] flex items-center gap-2 group mb-4"
            >
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              Back to Home
            </Button>
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600 shadow-sm">
                <Bell className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-black text-[#1A1A1A] tracking-tight">
                  Notification Center
                </h1>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                  Live Kitchen & Delivery Updates
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications Card */}
        <div className="bg-white rounded-[2.5rem] border border-gray-100 p-6 md:p-8 shadow-xl">
          <NotificationList userId={user.id} />
        </div>
      </div>
    </div>
  );
}
