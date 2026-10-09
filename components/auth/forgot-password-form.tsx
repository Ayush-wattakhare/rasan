'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowRight, ArrowLeft, Mail, CheckCircle2 } from 'lucide-react';

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      const supabase = createClient();

      // Route through /api/auth/callback to automatically exchange PKCE code for a valid session
      const callbackUrl = `${window.location.origin}/api/auth/callback?next=/reset-password`;

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: callbackUrl,
      });

      if (resetError) {
        setError(resetError.message);
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);
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
            <CardTitle className="text-2xl font-black text-gray-900 tracking-tight">Forgot password?</CardTitle>
            <CardDescription className="text-xs font-medium">
              Enter your email address and we&apos;ll send you a secure link to reset your password.
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
                    <strong className="font-bold block text-sm mb-0.5">Password reset link sent!</strong>
                    Check your email inbox at <span className="font-bold">{email}</span> for instructions to set your new password.
                  </div>
                </div>
              )}

              {!success && (
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-black uppercase text-gray-400 tracking-wider">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading || success}
                      className="h-12 bg-gray-50/80 rounded-xl border-gray-200 text-sm focus:border-orange-500 focus:bg-white pl-10"
                    />
                    <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              )}
            </CardContent>

            <CardFooter className="flex flex-col space-y-3 pt-2">
              {!success ? (
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-orange-600 hover:bg-orange-500 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-orange-600/25 flex items-center justify-center gap-2 cursor-pointer"
                  disabled={loading || success}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Sending Link...
                    </>
                  ) : (
                    <>
                      Send reset link <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-12 rounded-xl text-xs font-bold uppercase tracking-wider"
                  onClick={() => { setSuccess(false); setEmail(''); }}
                >
                  Send to a different email
                </Button>
              )}

              <p className="text-xs text-center text-gray-500 font-medium">
                Remember your password?{' '}
                <Link href="/login" className="text-orange-600 hover:text-orange-700 font-bold hover:underline inline-flex items-center gap-1">
                  <ArrowLeft className="w-3 h-3 inline" /> Back to sign in
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>

      </div>
    </div>
  );
}
