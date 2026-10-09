import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const serviceSupabase = createServiceClient();

    // Test basic connection
    const { data: testData, error: testError } = await serviceSupabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (testError) {
      return NextResponse.json({
        error: 'Database connection failed',
        details: testError.message,
        code: testError.code
      });
    }

    // Check if vendors table exists and its structure
    const { data: vendorsData, error: vendorsError } = await serviceSupabase
      .from('vendors')
      .select('*')
      .limit(1);

    // Check if meals table exists and its structure  
    const { data: mealsData, error: mealsError } = await serviceSupabase
      .from('meals')
      .select('*')
      .limit(1);

    return NextResponse.json({
      success: true,
      database: {
        connection: 'OK',
        vendors: {
          accessible: !vendorsError,
          error: vendorsError?.message,
          sampleData: vendorsData
        },
        meals: {
          accessible: !mealsError,
          error: mealsError?.message,
          sampleData: mealsData
        }
      }
    });

  } catch (error) {
    return NextResponse.json({
      error: 'Unexpected error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}