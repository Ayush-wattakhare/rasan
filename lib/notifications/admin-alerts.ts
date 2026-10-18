import { createServiceClient } from '@/lib/supabase/server';

/**
 * Sends an in-app notification to every active admin. Best effort: failures
 * are logged, never thrown, so they can't break the request that triggered them.
 */
export async function notifyAdmins(input: {
  title: string;
  message: string;
  data?: Record<string, unknown>;
}): Promise<void> {
  try {
    const serviceClient = createServiceClient();
    const { data: admins, error } = await serviceClient
      .from('profiles')
      .select('id')
      .eq('role', 'admin')
      .eq('is_active', true)
      .limit(200);

    if (error || !admins?.length) {
      if (error) console.error('notifyAdmins lookup error:', error);
      return;
    }

    const { error: insertError } = await serviceClient.from('notifications').insert(
      admins.map((a) => ({
        user_id: a.id,
        type: 'system' as const,
        title: input.title,
        message: input.message,
        data: (input.data ?? {}) as any,
        is_read: false,
      }))
    );
    if (insertError) console.error('notifyAdmins insert error:', insertError);
  } catch (err) {
    console.error('notifyAdmins failed:', err);
  }
}

/** Application status stored in vendors/delivery_partners.documents by the admin verify route. */
export function applicationStatusOf(documents: unknown): 'pending' | 'approved' | 'declined' | 'blocked' {
  const status = (documents as Record<string, unknown> | null)?.application_status;
  return status === 'approved' || status === 'declined' || status === 'blocked' ? status : 'pending';
}
