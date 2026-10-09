import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get('vendor_id');

    const serviceSupabase = createServiceClient();

    if (vendorId) {
      // Get meals for specific vendor
      const { data: meals, error } = await serviceSupabase
        .from('meals')
        .select('*')
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false });

      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        meals: meals || [],
      });
    } else {
      // Get all meals (for customer dashboard) - only proper active vendors
      const { data: meals, error } = await serviceSupabase
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
        .not('vendors.business_name', 'ilike', '%test%')
        .order('created_at', { ascending: false });

      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
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
    const body = await request.json();
    const {
      vendor_id,
      name,
      description,
      category,
      meal_type,
      price,
      preparation_time,
      is_veg,
      is_available,
      ingredients,
      allergens,
      rating,
      image_url,
      stock,
    } = body;

    // Validate required fields
    if (!vendor_id || !name || !category || !meal_type || !price || !preparation_time) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
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
        name,
        description: description || null,
        category,
        meal_type,
        price: parseFloat(price),
        preparation_time: parseInt(preparation_time),
        is_veg: is_veg || false,
        is_available: is_available !== false,
        ingredients: ingredients || [],
        allergens: allergens || [],
        rating: rating || 4.0,
        image_url: image_url || null,
        stock: stock != null ? parseInt(stock) : null,
      })
      .select()
      .single();

    if (mealError) {
      console.error('Error creating meal:', mealError);
      return NextResponse.json(
        { error: `Failed to create meal: ${mealError.message}` },
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