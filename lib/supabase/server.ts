import { createServerClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database.types';

/**
 * Creates a Supabase client for server components with cookie-based auth
 * This client respects RLS policies based on the authenticated user
 */
export async function createClient() {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

  return createServerClient<Database>(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
      global: {
        fetch: (fetchUrl, options = {}) => {
          const timeoutSignal = AbortSignal.timeout(2500);
          const signal = options.signal
            ? AbortSignal.any([options.signal, timeoutSignal])
            : timeoutSignal;
          return fetch(fetchUrl, {
            ...options,
            signal,
          });
        },
      },
    }
  );
}

/**
 * Creates a Supabase client for static generation (no cookies)
 */
export function createStaticClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

  return createSupabaseClient<Database>(
    url,
    anonKey
  );
}

/**
 * Creates a Supabase client with service role key for server-side operations
 * This client bypasses RLS policies and should only be used in secure server contexts
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-key';

  return createSupabaseClient<Database>(
    url,
    serviceKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
