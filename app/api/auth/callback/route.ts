import { createClient, createServiceClient } from '@/lib/supabase/server';
import { safeRedirectPath } from '@/lib/utils/safe-redirect';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const rawNext = searchParams.get('next');
  // Only same-origin relative paths; `next=@evil.com` etc. fall back to "/"
  const next = rawNext ? safeRedirectPath(rawNext) : null;

  if (code) {
    const supabase = await createClient();
    const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && sessionData?.user) {
      const user = sessionData.user;
      const serviceClient = createServiceClient();

      // Check if profile exists
      const { data: profile } = await serviceClient
        .from('profiles')
        .select('id, role')
        .eq('id', user.id)
        .maybeSingle();

      let userRole = profile?.role;

      // If new user via OAuth, create default customer profile
      if (!profile) {
        const fullName =
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email?.split('@')[0] ||
          'Customer';

        await serviceClient.from('profiles').insert({
          id: user.id,
          email: user.email || '',
          name: fullName,
          role: 'customer',
          is_active: true,
          is_verified: true,
          phone_verified: false,
        });

        userRole = 'customer';
      }

      // Determine redirect destination
      if (next && next !== '/') {
        return NextResponse.redirect(new URL(next, origin));
      }

      switch (userRole) {
        case 'vendor':
          return NextResponse.redirect(new URL('/vendor-dashboard', origin));
        case 'delivery':
          return NextResponse.redirect(new URL('/delivery-dashboard', origin));
        case 'admin':
          return NextResponse.redirect(new URL('/admin-dashboard', origin));
        case 'customer':
        default:
          return NextResponse.redirect(new URL('/dashboard', origin));
      }
    }
  }

  // Return the user to login with error parameter
  return NextResponse.redirect(`${origin}/login?error=Could not authenticate user`);
}
