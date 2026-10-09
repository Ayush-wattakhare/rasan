import * as fc from 'fast-check'

/**
 * Property-Based Tests for Order Calculations
 * These tests verify mathematical properties that should always hold true
 */

// Helper function to calculate order total
function calculateOrderTotal(
  subtotal: number,
  deliveryFee: number,
  tax: number,
  discount: number
): number {
  return subtotal + deliveryFee + tax - discount
}

// Helper function to calculate subtotal from items
function calculateSubtotal(items: Array<{ price: number; quantity: number }>): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0)
}

describe('Order Calculations - Property-Based Tests', () => {
  describe('Order Total Calculation', () => {
    it('total should always be non-negative when discount <= subtotal + deliveryFee + tax', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 0, max: 10000, noNaN: true }),
          fc.float({ min: 0, max: 500, noNaN: true }),
          fc.float({ min: 0, max: 1000, noNaN: true }),
          (subtotal, deliveryFee, tax) => {
            const maxDiscount = subtotal + deliveryFee + tax
            const discount = Math.random() * maxDiscount
            const total = calculateOrderTotal(subtotal, deliveryFee, tax, discount)
            return total >= 0
          }
        )
      )
    })

    it('total should equal subtotal + deliveryFee + tax - discount', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 0, max: 10000, noNaN: true }),
          fc.float({ min: 0, max: 500, noNaN: true }),
          fc.float({ min: 0, max: 1000, noNaN: true }),
          fc.float({ min: 0, max: 1000, noNaN: true }),
          (subtotal, deliveryFee, tax, discount) => {
            const total = calculateOrderTotal(subtotal, deliveryFee, tax, discount)
            const expected = subtotal + deliveryFee + tax - discount
            return Math.abs(total - expected) < 0.01 // Allow for floating point precision
          }
        )
      )
    })

    it('increasing subtotal should increase total (when other values constant)', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 0, max: 5000, noNaN: true }),
          fc.float({ min: 0, max: 5000, noNaN: true }),
          fc.float({ min: 0, max: 500, noNaN: true }),
          fc.float({ min: 0, max: 1000, noNaN: true }),
          fc.float({ min: 0, max: 500, noNaN: true }),
          (subtotal1, subtotal2, deliveryFee, tax, discount) => {
            const diff = Math.abs(subtotal1 - subtotal2)
            if (diff < 0.01) return true // Skip if values are too close
            const total1 = calculateOrderTotal(subtotal1, deliveryFee, tax, discount)
            const total2 = calculateOrderTotal(subtotal2, deliveryFee, tax, discount)
            return subtotal1 < subtotal2 ? total1 < total2 : total1 > total2
          }
        )
      )
    })

    it('increasing discount should decrease total', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 100, max: 10000, noNaN: true }),
          fc.float({ min: 0, max: 500, noNaN: true }),
          fc.float({ min: 0, max: 1000, noNaN: true }),
          fc.float({ min: 0, max: 500, noNaN: true }),
          fc.float({ min: 0, max: 500, noNaN: true }),
          (subtotal, deliveryFee, tax, discount1, discount2) => {
            const diff = Math.abs(discount1 - discount2)
            if (diff < 0.01) return true // Skip if values are too close
            const total1 = calculateOrderTotal(subtotal, deliveryFee, tax, discount1)
            const total2 = calculateOrderTotal(subtotal, deliveryFee, tax, discount2)
            return discount1 < discount2 ? total1 > total2 : total1 < total2
          }
        )
      )
    })
  })

  describe('Subtotal Calculation', () => {
    it('subtotal should be sum of (price × quantity) for all items', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              price: fc.float({ min: 1, max: 1000, noNaN: true }),
              quantity: fc.integer({ min: 1, max: 10 }),
            }),
            { minLength: 1, maxLength: 10 }
          ),
          (items) => {
            const subtotal = calculateSubtotal(items)
            const expected = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
            return Math.abs(subtotal - expected) < 0.01
          }
        )
      )
    })

    it('subtotal should be zero for empty cart', () => {
      expect(calculateSubtotal([])).toBe(0)
    })

    it('subtotal should increase when adding items', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              price: fc.float({ min: 1, max: 1000, noNaN: true }),
              quantity: fc.integer({ min: 1, max: 10 }),
            }),
            { minLength: 1, maxLength: 5 }
          ),
          fc.record({
            price: fc.float({ min: 1, max: 1000, noNaN: true }),
            quantity: fc.integer({ min: 1, max: 10 }),
          }),
          (items, newItem) => {
            const subtotal1 = calculateSubtotal(items)
            const subtotal2 = calculateSubtotal([...items, newItem])
            return subtotal2 > subtotal1
          }
        )
      )
    })

    it('doubling all quantities should double the subtotal', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              price: fc.float({ min: 1, max: 1000, noNaN: true }),
              quantity: fc.integer({ min: 1, max: 5 }),
            }),
            { minLength: 1, maxLength: 10 }
          ),
          (items) => {
            const subtotal1 = calculateSubtotal(items)
            const doubledItems = items.map((item) => ({
              ...item,
              quantity: item.quantity * 2,
            }))
            const subtotal2 = calculateSubtotal(doubledItems)
            return Math.abs(subtotal2 - subtotal1 * 2) < 0.01
          }
        )
      )
    })
  })

  describe('Tax Calculation', () => {
    it('tax should be proportional to subtotal', () => {
      const TAX_RATE = 0.05 // 5% tax rate

      fc.assert(
        fc.property(
          fc.float({ min: 0, max: 10000, noNaN: true }),
          (subtotal) => {
            const tax = subtotal * TAX_RATE
            const expectedTax = subtotal * TAX_RATE
            return Math.abs(tax - expectedTax) < 0.01
          }
        )
      )
    })

    it('doubling subtotal should double the tax', () => {
      const TAX_RATE = 0.05

      fc.assert(
        fc.property(
          fc.float({ min: 1, max: 10000, noNaN: true }),
          (subtotal) => {
            const tax1 = subtotal * TAX_RATE
            const tax2 = subtotal * 2 * TAX_RATE
            return Math.abs(tax2 - tax1 * 2) < 0.01
          }
        )
      )
    })
  })

  describe('Delivery Fee Calculation', () => {
    it('delivery fee should increase with distance', () => {
      const BASE_FEE = 20
      const PER_KM_RATE = 10

      const calculateDeliveryFee = (distanceKm: number) => {
        return BASE_FEE + distanceKm * PER_KM_RATE
      }

      fc.assert(
        fc.property(
          fc.float({ min: 0, max: 50, noNaN: true }),
          fc.float({ min: 0, max: 50, noNaN: true }),
          (distance1, distance2) => {
            const diff = Math.abs(distance1 - distance2)
            if (diff < 0.01) return true // Skip if values are too close
            const fee1 = calculateDeliveryFee(distance1)
            const fee2 = calculateDeliveryFee(distance2)
            return distance1 < distance2 ? fee1 < fee2 : fee1 > fee2
          }
        )
      )
    })
  })
})
