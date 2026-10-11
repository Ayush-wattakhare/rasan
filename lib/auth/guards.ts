import { NextResponse } from 'next/server';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { isUserRole } from '@/lib/auth/roles';
import type { UserRole } from '@/types';

type ServerClient = Awaited<ReturnType<typeof createClient>>;

export type AuthSuccess = {
  ok: true;
  user: User;
  role: UserRole | null;
  supabase: ServerClient;
};

export type AuthFailure = {
  ok: false;
  response: NextResponse;
};

export type AuthResult = AuthSuccess | AuthFailure;

function fail(status: 401 | 403, error: string): AuthFailure {
  return { ok: false, response: NextResponse.json({ error }, { status }) };
}

/**
 * Requires a signed-in, active user. The role is read from `profiles`
 * (server-side truth), never from user-editable metadata.
 *
 * Usage in a route handler:
 *   const auth = await requireUser();
 *   if (!auth.ok) return auth.response;
 */
export async function requireUser(): Promise<AuthResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return fail(401, 'Unauthorized');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_active')
    .eq('id', user.id)
    .maybeSingle();

  if (profile && profile.is_active === false) {
    return fail(403, 'Account is suspended');
  }

  return {
    ok: true,
    user,
    role: isUserRole(profile?.role) ? profile.role : null,
    supabase,
  };
}

/** Requires a signed-in user whose `profiles.role` is one of `roles`. */
export async function requireRole(...roles: UserRole[]): Promise<AuthResult> {
  const auth = await requireUser();
  if (!auth.ok) return auth;

  if (!auth.role || !roles.includes(auth.role)) {
    return fail(403, roles.length === 1 && roles[0] === 'admin'
      ? 'Admin access required'
      : 'Forbidden');
  }

  return auth;
}

export function requireAdmin(): Promise<AuthResult> {
  return requireRole('admin');
}
