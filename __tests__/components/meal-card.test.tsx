import React from 'react'
import { render, screen } from '../utils/test-utils'
import MealCard from '@/components/meals/meal-card'

const mockMeal = {
  id: '1',
  name: 'Special Dal Tadka',
  description: 'Smoky yellow lentils with aromatic spices',
  price: 180,
  image_url: null,
  // The database column is is_veg (the card used to read is_vegetarian and
  // showed every meal as non-veg).
  is_veg: true,
  rating: 4.5,
  stock: null,
  vendor_id: 'vendor-1',
  vendors: {
    id: 'vendor-1',
    business_name: "Mama's Kitchen"
  }
}

describe('MealCard', () => {
  it('renders meal information correctly', () => {
    render(<MealCard meal={mockMeal} />)
    
    expect(screen.getByText('Special Dal Tadka')).toBeInTheDocument()
    expect(screen.getByText("Mama's Kitchen")).toBeInTheDocument()
    expect(screen.getByText('₹180')).toBeInTheDocument()
    expect(screen.getByText('4.5')).toBeInTheDocument()
  })

  it('displays the vegetarian indicator correctly', () => {
    const { container } = render(<MealCard meal={mockMeal} />)
    const vegIndicator = container.querySelector('.bg-green-500\\/90')
    expect(vegIndicator).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Vegetarian' })).toBeInTheDocument()
  })

  it('displays the non-vegetarian indicator correctly', () => {
    const nonVegMeal = { ...mockMeal, is_veg: false }
    const { container } = render(<MealCard meal={nonVegMeal} />)
    const nonVegIndicator = container.querySelector('.bg-red-500\\/90')
    expect(nonVegIndicator).toBeInTheDocument()
  })

  it('shows "New" instead of a rating for unrated meals', () => {
    render(<MealCard meal={{ ...mockMeal, rating: 0 }} />)
    expect(screen.getByText('New')).toBeInTheDocument()
  })

  it('links to the correct meal details page', () => {
    render(<MealCard meal={mockMeal} />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/meals/1')
  })

  it('renders the quick add to cart button', () => {
    render(<MealCard meal={mockMeal} />)
    const quickAddBtn = screen.getByTestId('quick-add-btn')
    expect(quickAddBtn).toBeInTheDocument()
    expect(quickAddBtn).not.toBeDisabled()
  })

  it('disables quick add button when meal is sold out (stock = 0)', () => {
    const soldOutMeal = { ...mockMeal, stock: 0 }
    render(<MealCard meal={soldOutMeal} />)
    const quickAddBtn = screen.getByTestId('quick-add-btn')
    expect(quickAddBtn).toBeDisabled()
  })

  it('disables quick add when the meal has no kitchen id (no fake fallback id)', () => {
    const { vendor_id: _omit, ...noVendor } = mockMeal
    render(<MealCard meal={{ ...noVendor, vendors: { business_name: "Mama's Kitchen" } }} />)
    expect(screen.getByTestId('quick-add-btn')).toBeDisabled()
  })
})
