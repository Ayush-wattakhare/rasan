import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();

    // Clear any remaining auth cookies explicitly
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    
    for (const cookie of allCookies) {
      if (
        cookie.name.includes('supabase') ||
        cookie.name.includes('sb-') ||
        cookie.name.includes('auth-token')
      ) {
        cookieStore.delete(cookie.name);
      }
    }

    return NextResponse.json({ success: true, message: 'Logged out successfully' });
  } catch (error: any) {
    console.error('Logout API error:', error);
    return NextResponse.json(
      { success: true, error: error.message || 'Partial signout' },
      { status: 200 }
    );
  }
}
