import { timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { expireUnpaidOrders } from '@/lib/orders/stock';

/**
 * Cancels online orders whose payment never completed (and gives their stock
 * back). Called by Vercel Cron, which sends `Authorization: Bearer <CRON_SECRET>`.
 * The same sweep also runs opportunistically when orders are placed and when
 * admins open the dashboard, so it keeps working on plans with daily-only cron.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET is not configured' }, { status: 503 });
  }
  const given = Buffer.from(request.headers.get('authorization') || '');
  const expected = Buffer.from(`Bearer ${secret}`);
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const expired = await expireUnpaidOrders();
  return NextResponse.json({ success: true, expired });
}
