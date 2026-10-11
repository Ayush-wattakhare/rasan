import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

const EDITABLE_MEAL_FIELDS = [
  'name',
  'description',
  'category',
  'meal_type',
  'price',
  'discount_price',
  'image_url',
  'ingredients',
  'allergens',
  'nutritional_info',
  'is_veg',
  'is_available',
  'stock',
  'preparation_time',
] as const;

function pickMealUpdates(body: any): { values: Record<string, unknown> } | { error: string } {
  const values: Record<string, unknown> = {};
  for (const field of EDITABLE_MEAL_FIELDS) {
    if (body && body[field] !== undefined) values[field] = body[field];
  }
  for (const field of ['price', 'discount_price', 'stock', 'preparation_time'] as const) {
    if (values[field] === undefined || values[field] === null) continue;
    const n = Number(values[field]);
    if (!Number.isFinite(n) || n < 0) return { error: `Invalid ${field}` };
    values[field] = n;
  }
  if (Object.keys(values).length === 0) return { error: 'No editable fields provided' };
  return { values };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: mealId } = await params;
    const body = await request.json();

    const supabase = await createClient();
    const serviceSupabase = createServiceClient();

    // Verify the user is authenticated and is a vendor
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the meal to verify ownership
    const { data: meal, error: mealError } = await serviceSupabase
      .from('meals')
      .select('vendor_id, vendors!inner(user_id)')
      .eq('id', mealId)
      .single();

    if (mealError || !meal) {
      return NextResponse.json(
        { error: 'Meal not found' },
        { status: 404 }
      );
    }

    // Verify the vendor belongs to the user
    if (meal.vendors.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to update this meal' },
        { status: 403 }
      );
    }

    // Allow-list editable fields; ownership, id, rating and timestamps never change here.
    const updates = pickMealUpdates(body);
    if ('error' in updates) {
      return NextResponse.json({ error: updates.error }, { status: 400 });
    }

    // Update the meal using service client to bypass RLS
    const { data: updatedMeal, error: updateError } = await serviceSupabase
      .from('meals')
      .update(updates.values)
      .eq('id', mealId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating meal:', updateError);
      return NextResponse.json(
        { error: 'Failed to update meal' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Meal updated successfully',
      meal: updatedMeal,
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: mealId } = await params;

    const supabase = await createClient();
    const serviceSupabase = createServiceClient();

    // Verify the user is authenticated and is a vendor
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the meal to verify ownership
    const { data: meal, error: mealError } = await serviceSupabase
      .from('meals')
      .select('vendor_id, vendors!inner(user_id)')
      .eq('id', mealId)
      .single();

    if (mealError || !meal) {
      return NextResponse.json(
        { error: 'Meal not found' },
        { status: 404 }
      );
    }

    // Verify the vendor belongs to the user
    if (meal.vendors.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to delete this meal' },
        { status: 403 }
      );
    }

    // Delete the meal using service client to bypass RLS
    const { error: deleteError } = await serviceSupabase
      .from('meals')
      .delete()
      .eq('id', mealId);

    if (deleteError) {
      console.error('Error deleting meal:', deleteError);
      return NextResponse.json(
        { error: `Failed to delete meal: ${deleteError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Meal deleted successfully',
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}