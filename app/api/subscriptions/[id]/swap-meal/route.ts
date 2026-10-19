import { NextResponse } from 'next/server';
import {
  checkDateChangeable,
  loadOwnedSubscription,
  notify,
  requireStatus,
  saveSubscription,
} from '@/lib/subscriptions/manage';

/** Sets a meal preference for one scheduled delivery. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const loaded = await loadOwnedSubscription(id);
    if (!loaded.ok) return loaded.response;
    const { sub, userId } = loaded;

    const body = await request.json().catch(() => ({}));
    const targetDate = body?.date;
    const mealTitle = typeof body?.mealTitle === 'string' ? body.mealTitle.trim().slice(0, 100) : '';
    const dietaryNotes = typeof body?.dietaryNotes === 'string' ? body.dietaryNotes.trim().slice(0, 500) : '';

    if (!mealTitle) {
      return NextResponse.json({ error: 'Target date and meal choice are required' }, { status: 400 });
    }

    const statusError = requireStatus(sub, ['active'], 'Meals can only be swapped on active subscriptions');
    if (statusError) return statusError.response;

    const dateError = checkDateChangeable(sub, targetDate);
    if (dateError) return dateError.response;

    const deliveries = sub.deliveries.map((d) => ({ ...d }));
    const index = deliveries.findIndex((d) => d.date === targetDate);
    if (index === -1) {
      return NextResponse.json({ error: 'No scheduled delivery found on this date' }, { status: 400 });
    }
    if (deliveries[index].status === 'skipped') {
      return NextResponse.json(
        { error: 'This date is marked as an Off-Day. Resume delivery first to customize meals.' },
        { status: 400 }
      );
    }
    if (deliveries[index].status !== 'scheduled') {
      return NextResponse.json(
        { error: 'This meal has already been delivered and cannot be swapped' },
        { status: 400 }
      );
    }

    deliveries[index] = {
      ...deliveries[index],
      meal_override: {
        meal_title: mealTitle,
        dietary_notes: dietaryNotes,
        updated_at: new Date().toISOString(),
      },
    };

    const saved = await saveSubscription(sub, { deliveries });
    if (!saved.ok) return saved.response;

    await notify(userId, {
      type: 'system',
      title: 'Meal Preference Updated',
      message: `Your meal for ${targetDate} has been customized to "${mealTitle}".`,
      data: { subscription_id: id, date: targetDate, meal_title: mealTitle },
    });
    await notify(sub.vendors?.user_id, {
      type: 'order',
      title: 'Tiffin Customization Request',
      message: `Customer selected "${mealTitle}" for ${targetDate}.${dietaryNotes ? ` Note: ${dietaryNotes}` : ''}`,
      data: { subscription_id: id, date: targetDate, meal_title: mealTitle },
    });

    return NextResponse.json({
      success: true,
      message: `Meal updated to "${mealTitle}" for ${targetDate}`,
      subscription: saved.subscription,
    });
  } catch (error) {
    console.error('Error in POST /api/subscriptions/[id]/swap-meal:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
