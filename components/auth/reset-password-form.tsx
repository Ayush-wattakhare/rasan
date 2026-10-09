'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowRight, Eye, EyeOff, Lock, CheckCircle2 } from 'lucide-react';

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    async function checkOrExchangeCode() {
      const code = searchParams?.get('code');
      const supabase = createClient();

      if (code) {
        try {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            console.warn('Direct code exchange notice:', exchangeError.message);
          }
        } catch (err) {
          console.error('Code exchange error:', err);
        }
      }

      // Check if user now has a session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session && !code) {
        // Only warn if neither code nor session is present
        setError('Your password reset link may be invalid or expired. Please request a new link.');
      }
      setIsInitializing(false);
    }

    checkOrExchangeCode();
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        setError(updateError.message);
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);

      // Smooth redirect after 2 seconds
      setTimeout(() => {
        router.push('/login?message=Password updated successfully. Please sign in with your new password.');
      }, 2000);
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
              <span className="font-black text-2xl text-gray-900 tracking-tight leading-tight">Rasan</span>
              <span className="text-[0.65rem] font-bold text-orange-600 uppercase tracking-widest leading-none">Home Made</span>
            </div>
          </Link>
          <p className="text-xs text-gray-500 font-medium">Authentic home-cooked tiffins and meals delivered</p>
        </div>

        {/* Main Card */}
        <Card className="border-none shadow-xl bg-white rounded-[2rem] overflow-hidden">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-black text-gray-900 tracking-tight">Set new password</CardTitle>
            <CardDescription className="text-xs font-medium">
              Enter your new password below to secure your account.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-100 text-red-700 p-3.5 rounded-2xl text-xs font-bold leading-relaxed animate-in fade-in">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-2xl text-xs font-medium leading-relaxed flex items-start gap-3 animate-in fade-in">
                  <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold block text-sm mb-0.5">Password updated!</strong>
                    Your password has been changed. Redirecting you to the sign in page...
                  </div>
                </div>
              )}

              {!success && (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-xs font-black uppercase text-gray-400 tracking-wider">
                      New Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading || isInitializing}
                        className="h-12 bg-gray-50/80 rounded-xl border-gray-200 text-sm focus:border-orange-500 focus:bg-white pl-10 pr-10"
                      />
                      <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="confirmPassword" className="text-xs font-black uppercase text-gray-400 tracking-wider">
                      Confirm New Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        disabled={loading || isInitializing}
                        className="h-12 bg-gray-50/80 rounded-xl border-gray-200 text-sm focus:border-orange-500 focus:bg-white pl-10"
                      />
                      <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                </>
              )}
            </CardContent>

            <CardFooter className="flex flex-col space-y-3 pt-2">
              {!success && (
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-orange-600 hover:bg-orange-500 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-orange-600/25 flex items-center justify-center gap-2 cursor-pointer"
                  disabled={loading || isInitializing}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Updating Password...
                    </>
                  ) : (
                    <>
                      Update Password <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              )}

              <p className="text-xs text-center text-gray-500 font-medium">
                Back to{' '}
                <Link href="/login" className="text-orange-600 hover:text-orange-700 font-bold hover:underline">
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>

      </div>
    </div>
  );
}
