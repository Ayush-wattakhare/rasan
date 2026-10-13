'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';

interface GoogleSignInButtonProps {
  label?: string;
  className?: string;
  variant?: 'light' | 'dark';
}

export function GoogleSignInButton({
  label = 'Continue with Google',
  className = '',
  variant = 'dark',
}: GoogleSignInButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const redirectTo = searchParams?.get('redirectTo') || searchParams?.get('redirect');

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      const supabase = createClient();

      const callbackUrl = new URL('/api/auth/callback', window.location.origin);
      if (redirectTo) {
        callbackUrl.searchParams.set('next', redirectTo);
      }

      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl.toString(),
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      });

      if (signInError) {
        setError(signInError.message || 'Failed to initiate Google sign-in');
        setLoading(false);
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  const isDark = variant === 'dark';

  return (
    <div className="w-full">
      <button
        type="button"
        id="btn-google-signin"
        onClick={handleGoogleSignIn}
        disabled={loading}
        className={`
          w-full h-12 px-4 rounded-2xl flex items-center justify-center gap-3 font-semibold text-sm transition-all
          border shadow-sm active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none
          ${
            isDark
              ? 'bg-white/10 hover:bg-white/15 text-white border-white/15 hover:border-white/25'
              : 'bg-white hover:bg-gray-50 text-gray-800 border-gray-200 hover:border-gray-300'
          }
          ${className}
        `}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
        ) : (
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
        )}
        <span>{loading ? 'Connecting to Google...' : label}</span>
      </button>

      {error && (
        <p className="mt-2 text-xs text-red-400 text-center">{error}</p>
      )}
    </div>
  );
}
