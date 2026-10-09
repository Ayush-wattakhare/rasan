import { redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CheckoutForm } from '@/components/checkout/checkout-form';
import { createClient } from '@/lib/supabase/server';
import type { Address } from '@/types';

export default async function CheckoutPage() {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/checkout');
  }

  // Get user profile with addresses
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) {
    redirect('/login');
  }

  // Extract addresses from profile
  const savedAddresses: Address[] = profile.address
    ? Array.isArray(profile.address)
      ? profile.address
      : [profile.address]
    : [];

  // For now, we'll get vendor_id from the cart items
  // In a real app, this would be validated server-side
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/cart">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Cart
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Checkout</h1>
          <p className="text-muted-foreground mt-2">
            Complete your order details
          </p>
        </div>

        {/* Checkout Form - Client Component */}
        <CheckoutForm
          userId={user.id}
          savedAddresses={savedAddresses}
        />
      </div>
    </div>
  );
}
