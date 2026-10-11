import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { isUserRole, roleFromAppMetadata } from '@/lib/auth/roles';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import BottomBar from '@/components/layout/bottom-bar';
import FloatingGetStarted from '@/components/floating-get-started';


const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Rasan - Authentic Home-Cooked Meals Delivered',
  description:
    'Get fresh, home-cooked meals from local home chefs. Tiffin service, meal subscriptions, and hyperlocal delivery. Empowering women entrepreneurs across India.',
  keywords: ['home-cooked food', 'tiffin service', 'meal subscription', 'home chefs', 'hyperlocal delivery', 'women empowerment', 'Indian food'],
};

import { CartProvider } from '@/lib/contexts/cart-context';
import { ToastProvider } from '@/components/ui/toast';

import Script from 'next/script';

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const hasAuthCookie = cookieStore
    .getAll()
    .some((c) => c.name.startsWith('sb-') && c.name.includes('-auth-token'));

  let profile = null;
  if (hasAuthCookie) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Role from app_metadata (not user-editable), else from profiles.
        let role = roleFromAppMetadata(user);
        if (!role) {
          const { data: row } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .maybeSingle();
          role = isUserRole(row?.role) ? row.role : null;
        }
        profile = {
          id: user.id,
          email: user.email || '',
          role: role ?? 'customer',
        };
      }
    } catch {
      // Non-blocking if auth fails or server is unreachable
    }
  }

  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-white font-sans antialiased relative">
        <Script
          id="razorpay-checkout"
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="lazyOnload"
        />
        <CartProvider>
          <ToastProvider>
            <div className="flex min-h-screen flex-col relative z-0">
              <Header user={profile} />
              <main className="flex-1 pb-24 md:pb-32">{children}</main>
              <Footer />
              {profile && <BottomBar userRole={profile.role} />}
              {!profile && <FloatingGetStarted />}

            </div>
          </ToastProvider>
        </CartProvider>
      </body>
    </html>
  );
}
