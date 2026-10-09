import React from 'react'
import { render, screen } from '../utils/test-utils'
import MealCard from '@/components/meals/meal-card'

const mockMeal = {
  id: '1',
  name: 'Special Dal Tadka',
  description: 'Smoky yellow lentils with aromatic spices',
  price: 180,
  image_url: null,
  is_vegetarian: true,
  rating: 4.5,
  stock: null,
  vendors: {
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
  })

  it('displays the non-vegetarian indicator correctly', () => {
    const nonVegMeal = { ...mockMeal, is_vegetarian: false }
    const { container } = render(<MealCard meal={nonVegMeal} />)
    const nonVegIndicator = container.querySelector('.bg-red-500\\/90')
    expect(nonVegIndicator).toBeInTheDocument()
  })

  it('links to the correct meal details page', () => {
    render(<MealCard meal={mockMeal} />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/meals/1')
  })
})
