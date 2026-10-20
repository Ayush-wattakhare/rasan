'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { safeRedirectPath } from '@/lib/utils/safe-redirect';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ArrowRight, Eye, EyeOff, Loader2, ShieldAlert } from 'lucide-react';
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams?.get('redirectTo') || searchParams?.get('redirect');
  const urlError = searchParams?.get('error');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(urlError || '');

  const handlePostLoginRedirect = async (userId: string) => {
    const supabase = createClient();
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle();

    const role = profile?.role || 'customer';

    // Same-origin paths only ("/\\evil.com" and similar tricks are rejected).
    const safeTarget = safeRedirectPath(redirectTo, '');
    if (role === 'customer' && safeTarget) {
      router.push(safeTarget);
      router.refresh();
      return;
    }

    switch (role) {
      case 'customer':
        router.push('/dashboard');
        break;
      case 'vendor':
        router.push('/vendor-dashboard');
        break;
      case 'delivery':
        router.push('/delivery-dashboard');
        break;
      case 'admin':
        router.push('/admin-dashboard');
        break;
      default:
        router.push('/');
    }
    router.refresh();
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        if (signInError.message.includes('Email not confirmed')) {
          setError('Please verify your email address. Check your inbox for the confirmation link.');
        } else if (signInError.message.includes('Invalid login credentials')) {
          setError('Invalid email or password. Please verify your credentials or register a new account.');
        } else {
          setError(signInError.message);
        }
        setLoading(false);
        return;
      }

      if (data.user) {
        await handlePostLoginRedirect(data.user.id);
      } else {
        setError('Login failed. Please try again.');
        setLoading(false);
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Header Logo */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <div className="bg-gradient-to-br from-orange-500 to-red-600 p-2.5 rounded-2xl shadow-lg shadow-orange-500/20 group-hover:scale-105 transition-transform">
              <span className="text-2xl leading-none">🍱</span>
            </div>
            <div className="flex flex-col text-left">
              <span className="font-black text-2xl text-gray-900 tracking-tight leading-tight">
                Rasan
              </span>
              <span className="text-[0.65rem] font-bold text-orange-600 uppercase tracking-widest leading-none">
                Home Made
              </span>
            </div>
          </Link>
          <p className="text-xs text-gray-500 font-medium">
            Authentic home-cooked tiffins and meals delivered
          </p>
        </div>

        {/* Card */}
        <Card className="border-none shadow-xl bg-white rounded-[2rem] overflow-hidden">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-black text-gray-900 tracking-tight">
              Welcome back
            </CardTitle>
            <CardDescription className="text-xs font-medium">
              Sign in to your Rasan account
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5 pt-0">
            {/* 1-Tap Google Sign In */}
            <div>
              <GoogleSignInButton label="Continue with Google" variant="light" />
            </div>

            {/* Divider */}
            <div className="relative flex items-center justify-center py-1">
              <div className="border-t border-gray-200 w-full" />
              <span className="bg-white px-3 text-[0.65rem] font-black uppercase tracking-widest text-gray-400 absolute">
                or sign in with email
              </span>
            </div>

            {/* Redirect Notice */}
            {redirectTo && (
              <div className="bg-orange-50 border border-orange-200 text-orange-900 p-3 rounded-2xl text-xs font-medium leading-relaxed flex items-start gap-2">
                <span className="text-sm">🔒</span>
                <span>Please sign in to complete your order.</span>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-700 p-3.5 rounded-2xl text-xs font-bold leading-relaxed flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Email + Password Form */}
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label
                  htmlFor="email"
                  className="text-xs font-black uppercase text-gray-400 tracking-wider"
                >
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="h-12 bg-gray-50/80 rounded-xl border-gray-200 text-sm focus:border-orange-500 focus:bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="password"
                    className="text-xs font-black uppercase text-gray-400 tracking-wider"
                  >
                    Password
                  </Label>
                  <Link
                    href="/forgot-password"
                    className="text-xs font-bold text-orange-600 hover:text-orange-700"
                  >
                    Forgot?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="h-12 bg-gray-50/80 rounded-xl border-gray-200 text-sm pr-12 focus:border-orange-500 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 p-1"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 text-orange-600" />
                    ) : (
                      <Eye className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-orange-600 hover:bg-orange-500 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-orange-600/25 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Sign in with Email</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col space-y-3 pt-0 pb-6 border-t border-gray-50">
            <p className="text-xs text-center text-gray-500 font-medium">
              Don&apos;t have an account?{' '}
              <Link
                href={
                  redirectTo
                    ? `/register?redirectTo=${encodeURIComponent(redirectTo)}`
                    : '/register'
                }
                className="text-orange-600 hover:text-orange-700 font-bold hover:underline"
              >
                Sign up
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

export function LoginForm() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}
