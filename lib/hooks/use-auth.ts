'use client';

import { useEffect, useSyncExternalStore } from 'react';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface AuthState {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  error: string | null;
}

/*
 * One shared auth store for the whole page. Previously every useAuth() call
 * created its own Supabase listener and profile query (meal details mounted
 * two), and the listener awaited a Supabase query inside onAuthStateChange,
 * which Supabase warns can deadlock the auth lock.
 */
const INITIAL: AuthState = { user: null, profile: null, loading: true, error: null };
let state: AuthState = INITIAL;
const listeners = new Set<() => void>();
let started = false;
let profileRequest = 0;

function setState(next: AuthState) {
  state = next;
  listeners.forEach((l) => l());
}

async function loadProfile(user: User | null) {
  const request = ++profileRequest;
  if (!user) {
    setState({ user: null, profile: null, loading: false, error: null });
    return;
  }
  try {
    const { data: profile } = await createClient()
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    // Ignore a slower response for an older auth event.
    if (request !== profileRequest) return;
    setState({ user, profile: (profile as Profile | null) ?? null, loading: false, error: null });
  } catch {
    if (request !== profileRequest) return;
    setState({ user, profile: null, loading: false, error: 'Failed to load profile' });
  }
}

function start() {
  if (started || typeof window === 'undefined') return;
  started = true;

  (async () => {
    try {
      const supabase = createClient();

      // Must stay synchronous: defer Supabase calls out of the auth callback.
      supabase.auth.onAuthStateChange((_event, session) => {
        const user = session?.user ?? null;
        setTimeout(() => {
          loadProfile(user);
        }, 0);
      });

      const { data } = await supabase.auth.getUser();
      await loadProfile(data?.user ?? null);
    } catch {
      setState({ user: null, profile: null, loading: false, error: 'Failed to load authentication state' });
    }
  })();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const getSnapshot = () => state;
const getServerSnapshot = () => INITIAL;

export function useAuth() {
  useEffect(() => {
    start();
  }, []);

  const current = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const signOut = async () => {
    await createClient().auth.signOut();
    setState({ user: null, profile: null, loading: false, error: null });
  };

  return {
    ...current,
    signOut,
    isAuthenticated: !!current.user,
    isCustomer: current.profile?.role === 'customer',
    isVendor: current.profile?.role === 'vendor',
    isDelivery: current.profile?.role === 'delivery',
    isAdmin: current.profile?.role === 'admin',
  };
}
