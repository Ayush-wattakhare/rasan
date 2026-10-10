import { NextResponse } from 'next/server';
import type { User } from '@supabase/supabase-js';
import { createClient, createServiceClient } from '@/lib/supabase/server';

type ApplicantRole = 'vendor' | 'delivery';

type ApplicantInput = {
  authUser: User | null;
  email?: string;
  password?: string;
  name: string;
  phone?: string;
  role: ApplicantRole;
};

type ApplicantResult =
  | { ok: true; userId: string; email: string }
  | { ok: false; response: NextResponse };

const LOGIN_REQUIRED_MESSAGE: Record<ApplicantRole, string> = {
  vendor: 'Please log in or enter an email and password to create your chef account.',
  delivery: 'Please log in or enter an email and password to create your delivery partner account.',
};

/**
 * Resolves the account a partner application belongs to.
 *
 * - Signed in: uses the session user. Admins cannot apply (it would demote them).
 * - Signed out: creates the account through the normal sign-up flow, so the
 *   project's email confirmation rules apply. Accounts are never created
 *   pre-confirmed, which would let anyone claim someone else's email address.
 */
export async function resolveApplicantAccount(input: ApplicantInput): Promise<ApplicantResult> {
  const serviceSupabase = createServiceClient();

  if (input.authUser) {
    const { data: profile } = await serviceSupabase
      .from('profiles')
      .select('role')
      .eq('id', input.authUser.id)
      .maybeSingle();

    if (profile?.role === 'admin') {
      return {
        ok: false,
        response: NextResponse.json(
          { error: 'Admin accounts cannot apply as partners.' },
          { status: 400 }
        ),
      };
    }

    return { ok: true, userId: input.authUser.id, email: input.authUser.email || '' };
  }

  const email = input.email?.trim();
  const password = input.password?.trim();

  if (!email || !password) {
    return {
      ok: false,
      response: NextResponse.json({ error: LOGIN_REQUIRED_MESSAGE[input.role] }, { status: 401 }),
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name: input.name, phone: input.phone || '' } },
  });

  // Supabase returns a user with no identities when the email is already registered.
  const alreadyRegistered =
    (error && /already|exists|registered/i.test(error.message)) ||
    (data?.user && (data.user.identities?.length ?? 0) === 0);

  if (alreadyRegistered) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'An account with this email already exists. Please log in first.' },
        { status: 400 }
      ),
    };
  }

  if (error || !data?.user) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: error?.message || 'Could not create account' },
        { status: 400 }
      ),
    };
  }

  await serviceSupabase.from('profiles').upsert({
    id: data.user.id,
    email,
    name: input.name,
    phone: input.phone || '',
    role: input.role,
    is_verified: false,
    is_active: true,
  });

  return { ok: true, userId: data.user.id, email };
}
