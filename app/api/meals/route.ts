import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { checkDiscount, validateMealInput } from '@/lib/validation/meal';
import { sanitizeSearch } from '@/lib/utils/search';
import { isUuid } from '@/lib/utils/validation-ids';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get('vendor_id');

    const serviceSupabase = createServiceClient();

    if (vendorId) {
      // Owners see their whole menu; everyone else only available meals.
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { data: ownVendor } = user
        ? await serviceSupabase
            .from('vendors')
            .select('id')
            .eq('id', vendorId)
            .eq('user_id', user.id)
            .maybeSingle()
        : { data: null };

      let mealsQuery = serviceSupabase
        .from('meals')
        .select('*')
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false });
      if (!ownVendor) {
        mealsQuery = mealsQuery.eq('is_available', true);
      }
      const { data: meals, error } = await mealsQuery;

      if (error) {
        console.error('Vendor meals error:', error);
        return NextResponse.json({ error: 'Failed to load meals' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        meals: meals || [],
      });
    } else {
      // Public listing (customer dashboard, header search): active kitchens only.
      // Paginated; the old '%test%' name filter hid real kitchens and is removed.
      const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '24', 10) || 24, 1), 100);
      const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10) || 0, 0);
      const search = sanitizeSearch(searchParams.get('search'));

      let listQuery = serviceSupabase
        .from('meals')
        .select(`
          *,
          vendors!inner (
            id,
            business_name,
            rating,
            is_active
          )
        `)
        .eq('is_available', true)
        .eq('vendors.is_active', true)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (search) {
        listQuery = listQuery.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
      }

      const { data: meals, error } = await listQuery;

      if (error) {
        console.error('Meals list error:', error);
        return NextResponse.json({ error: 'Failed to load meals' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        meals: meals || [],
      });
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const vendor_id = body?.vendor_id;
    if (!isUuid(vendor_id)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const validated = validateMealInput(body, false);
    if ('error' in validated) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }
    const v = validated.values;
    const discountError = checkDiscount(v.price, v.discount_price);
    if (discountError) {
      return NextResponse.json({ error: discountError }, { status: 400 });
    }

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

    // Verify the vendor belongs to the user
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('id')
      .eq('id', vendor_id)
      .eq('user_id', user.id)
      .single();

    if (vendorError || !vendor) {
      return NextResponse.json(
        { error: 'Vendor not found or unauthorized' },
        { status: 403 }
      );
    }

    // Create the meal using service client to bypass RLS
    const { data: meal, error: mealError } = await serviceSupabase
      .from('meals')
      .insert({
        vendor_id,
        name: v.name as string,
        description: (v.description as string | null) ?? null,
        category: v.category as string,
        meal_type: v.meal_type as any,
        price: v.price as number,
        discount_price: (v.discount_price as number | null) ?? null,
        preparation_time: v.preparation_time as number,
        is_veg: v.is_veg === true,
        is_available: v.is_available !== false,
        ingredients: (v.ingredients as string[]) ?? [],
        allergens: (v.allergens as string[]) ?? [],
        // Ratings come from customer reviews only.
        rating: 0,
        image_url: (v.image_url as string | null) ?? null,
        stock: (v.stock as number | null) ?? null,
      } as any)
      .select()
      .single();

    if (mealError) {
      console.error('Error creating meal:', mealError);
      return NextResponse.json(
        { error: 'Failed to create meal' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Meal created successfully',
      meal,
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}