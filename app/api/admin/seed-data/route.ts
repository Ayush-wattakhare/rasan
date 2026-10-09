import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { createClient } from '@/lib/supabase/server';
import type { MealInsert } from '@/lib/supabase/types';

export async function POST(request: NextRequest) {
  try {
    // Check if request is from admin
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const serviceSupabase = createServiceClient();

    // First, create a sample vendor if none exists
    const { data: existingVendors } = await serviceSupabase
      .from('vendors')
      .select('id')
      .limit(1);

    let vendorId = existingVendors?.[0]?.id;

    if (!vendorId) {
      // Create a sample vendor user first
      const { data: vendorAuthData, error: vendorAuthError } = await serviceSupabase.auth.admin.createUser({
        email: 'sample.vendor@rasan.com',
        password: 'vendor123',
        email_confirm: true,
        user_metadata: {
          name: 'Sample Home Chef',
          role: 'vendor',
        },
      });

      if (vendorAuthError || !vendorAuthData.user) {
        return NextResponse.json(
          { error: 'Failed to create sample vendor user' },
          { status: 500 }
        );
      }

      // Create vendor profile
      await serviceSupabase
        .from('profiles')
        .insert({
          id: vendorAuthData.user.id,
          email: 'sample.vendor@rasan.com',
          name: 'Sample Home Chef',
          role: 'vendor',
          is_active: true,
          is_verified: true,
        });

      // Create vendor record
      const { data: vendorData, error: vendorError } = await serviceSupabase
        .from('vendors')
        .insert([{
          user_id: vendorAuthData.user.id,
          business_name: 'Mama\'s Kitchen',
          description: 'Authentic home-cooked Indian meals made with love',
          cuisine: ['Indian', 'North Indian', 'Vegetarian'],
          location: 'POINT(72.8777 19.0760)' as any,
          address: 'Mumbai, Maharashtra, India',
          phone: '+919876543210',
          email: 'sample.vendor@rasan.com',
          operating_hours: {
            monday: { open_time: '09:00', close_time: '21:00', is_open: true },
            tuesday: { open_time: '09:00', close_time: '21:00', is_open: true },
            wednesday: { open_time: '09:00', close_time: '21:00', is_open: true },
            thursday: { open_time: '09:00', close_time: '21:00', is_open: true },
            friday: { open_time: '09:00', close_time: '21:00', is_open: true },
            saturday: { open_time: '09:00', close_time: '21:00', is_open: true },
            sunday: { open_time: '09:00', close_time: '21:00', is_open: true },
          },
          rating: 4.5,
          total_orders: 150,
          is_active: true,
        }])
        .select('id')
        .single();

      if (vendorError || !vendorData) {
        return NextResponse.json(
          { error: 'Failed to create sample vendor' },
          { status: 500 }
        );
      }

      vendorId = vendorData.id;
    }

    // Sample meals data
    const sampleMeals: MealInsert[] = [
      {
        vendor_id: vendorId,
        name: 'Chapati Bhaji',
        description: 'Fresh rotis with seasonal vegetables curry prepared with love and care',
        category: 'Main Course',
        meal_type: 'lunch',
        price: 60,
        discount_price: null,
        image_url: null,
        ingredients: ['Wheat flour', 'Mixed vegetables', 'Onions', 'Tomatoes', 'Spices'],
        allergens: ['Gluten'],
        nutritional_info: {
          calories: 350,
          protein: 12,
          carbs: 55,
          fat: 8
        },
        is_veg: true,
        is_available: true,
        stock: null,
        preparation_time: 30,
        rating: 4.5,
      },
      {
        vendor_id: vendorId,
        name: 'Rice Plate',
        description: 'Steamed rice with dal, sabzi, and accompaniments - a complete meal',
        category: 'Main Course',
        meal_type: 'lunch',
        price: 80,
        discount_price: 70,
        image_url: null,
        ingredients: ['Basmati rice', 'Dal', 'Mixed vegetables', 'Pickle', 'Papad'],
        allergens: [],
        nutritional_info: {
          calories: 420,
          protein: 15,
          carbs: 70,
          fat: 10
        },        is_veg: true,
        is_available: true,
        stock: null,
        preparation_time: 25,
        rating: 4.3,
      },
      {
        vendor_id: vendorId,
        name: 'Chana Poha',
        description: 'Homemade fresh food prepared with love and care - flattened rice with chickpeas',
        category: 'Breakfast',
        meal_type: 'breakfast',
        price: 40,
        discount_price: null,
        image_url: null,
        ingredients: ['Poha', 'Chickpeas', 'Onions', 'Green chilies', 'Curry leaves'],
        allergens: [],
        nutritional_info: {
          calories: 280,
          protein: 10,
          carbs: 45,
          fat: 6
        },
        is_veg: true,
        is_available: true,
        stock: null,
        preparation_time: 20,
        rating: 4.4,
      },
      {
        vendor_id: vendorId,
        name: 'Rajma Chawal',
        description: 'Kidney beans curry with steamed rice - comfort food at its best',
        category: 'Main Course',
        meal_type: 'lunch',
        price: 90,
        discount_price: null,
        image_url: null,
        ingredients: ['Kidney beans', 'Basmati rice', 'Onions', 'Tomatoes', 'Garam masala'],
        allergens: [],
        nutritional_info: {
          calories: 450,
          protein: 18,
          carbs: 65,
          fat: 12
        },
        is_veg: true,
        is_available: true,
        stock: null,
        preparation_time: 35,
        rating: 4.6,
      },
      {
        vendor_id: vendorId,
        name: 'Aloo Paratha',
        description: 'Stuffed potato flatbread served with yogurt and pickle',
        category: 'Breakfast',
        meal_type: 'breakfast',
        price: 50,
        discount_price: 45,
        image_url: null,
        ingredients: ['Wheat flour', 'Potatoes', 'Yogurt', 'Pickle', 'Butter'],
        allergens: ['Gluten', 'Dairy'],
        nutritional_info: {
          calories: 320,
          protein: 8,
          carbs: 50,
          fat: 10
        },
        is_veg: true,
        is_available: true,
        stock: null,
        preparation_time: 25,
        rating: 4.2,
      },
      {
        vendor_id: vendorId,
        name: 'Dal Tadka',
        description: 'Yellow lentils tempered with cumin and spices - soul food',
        category: 'Main Course',
        meal_type: 'dinner',
        price: 65,
        discount_price: null,
        image_url: null,
        ingredients: ['Yellow dal', 'Cumin', 'Garlic', 'Ginger', 'Green chilies'],
        allergens: [],
        nutritional_info: {
          calories: 220,
          protein: 14,
          carbs: 35,
          fat: 4
        },
        is_veg: true,
        is_available: true,
        stock: null,
        preparation_time: 30,
        rating: 4.3,
      },
      {
        vendor_id: vendorId,
        name: 'Vegetable Biryani',
        description: 'Fragrant basmati rice cooked with mixed vegetables and aromatic spices',
        category: 'Main Course',
        meal_type: 'dinner',
        price: 120,
        discount_price: 100,
        image_url: null,
        ingredients: ['Basmati rice', 'Mixed vegetables', 'Biryani masala', 'Saffron', 'Mint'],
        allergens: ['Nuts'],
        nutritional_info: {
          calories: 380,
          protein: 12,
          carbs: 60,
          fat: 12
        },
        is_veg: true,
        is_available: true,
        stock: null,
        preparation_time: 45,
        rating: 4.7,
      },
      {
        vendor_id: vendorId,
        name: 'Masala Dosa',
        description: 'Crispy rice crepe filled with spiced potato filling, served with chutney',
        category: 'South Indian',
        meal_type: 'breakfast',
        price: 70,
        discount_price: null,
        image_url: null,
        ingredients: ['Rice', 'Urad dal', 'Potatoes', 'Coconut chutney', 'Sambar'],
        allergens: [],
        nutritional_info: {
          calories: 300,
          protein: 8,
          carbs: 55,
          fat: 6
        },
        is_veg: true,
        is_available: true,
        stock: null,
        preparation_time: 20,
        rating: 4.4,
      }
    ];

    // Insert sample meals
    const { data: mealsData, error: mealsError } = await serviceSupabase
      .from('meals')
      .insert(sampleMeals)
      .select('id');

    if (mealsError) {
      console.error('Error inserting meals:', mealsError);
      return NextResponse.json(
        { error: `Failed to create sample meals: ${mealsError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Sample data created successfully',
      data: {
        vendorId,
        mealsCreated: mealsData?.length || 0,
      },
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}