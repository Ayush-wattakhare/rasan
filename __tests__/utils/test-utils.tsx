import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'

// Mock providers wrapper
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }

// Common test data
export const mockUser = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  email: 'test@example.com',
  name: 'Test User',
  role: 'customer' as const,
}

export const mockVendor = {
  id: '123e4567-e89b-12d3-a456-426614174001',
  user_id: mockUser.id,
  business_name: 'Test Restaurant',
  cuisine: ['Indian', 'Chinese'],
  rating: 4.5,
  is_active: true,
}

export const mockMeal = {
  id: '123e4567-e89b-12d3-a456-426614174002',
  vendor_id: mockVendor.id,
  name: 'Test Meal',
  description: 'Delicious test meal',
  category: 'Main Course',
  meal_type: 'lunch' as const,
  price: 299,
  is_veg: true,
  is_available: true,
  preparation_time: 30,
  rating: 4.2,
}

export const mockOrder = {
  id: '123e4567-e89b-12d3-a456-426614174003',
  order_number: 'ORD-20240101-1234',
  customer_id: mockUser.id,
  vendor_id: mockVendor.id,
  items: [
    {
      meal_id: mockMeal.id,
      name: mockMeal.name,
      quantity: 2,
      price: mockMeal.price,
      customizations: [],
    },
  ],
  subtotal: 598,
  delivery_fee: 50,
  tax: 64.8,
  discount: 0,
  total: 712.8,
  status: 'pending' as const,
  payment_status: 'pending' as const,
  payment_method: 'card' as const,
  delivery_address: {
    street: '123 Test St',
    city: 'Test City',
    state: 'Test State',
    zip_code: '12345',
    coordinates: { lat: 12.9716, lng: 77.5946 },
  },
}

// Helper to wait for async updates
export const waitForLoadingToFinish = () =>
  new Promise((resolve) => setTimeout(resolve, 0))

// Prevent Jest from treating this as a test file
export {}
