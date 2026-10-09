'use client';

import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface AuthState {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  error: string | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const supabase = createClient();

    // Get initial session
    const getInitialSession = async () => {
      try {
        let user: User | null = null;
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user) {
          user = userData.user;
        } else {
          const { data: sessionData } = await supabase.auth.getSession();
          user = sessionData?.session?.user || null;
        }

        if (user) {
          // Fetch user profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          setState({
            user,
            profile: profile || null,
            loading: false,
            error: null,
          });
        } else {
          setState({ user: null, profile: null, loading: false, error: null });
        }
      } catch (err) {
        setState({
          user: null,
          profile: null,
          loading: false,
          error: 'Failed to load authentication state',
        });
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          // Fetch updated profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          setState({ 
            user: session.user, 
            profile: profile || null, 
            loading: false, 
            error: null 
          });
        } else {
          setState({ user: null, profile: null, loading: false, error: null });
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setState({ user: null, profile: null, loading: false, error: null });
  };

  return {
    ...state,
    signOut,
    isAuthenticated: !!state.user,
    isCustomer: state.profile?.role === 'customer',
    isVendor: state.profile?.role === 'vendor',
    isDelivery: state.profile?.role === 'delivery',
    isAdmin: state.profile?.role === 'admin',
  };
}
