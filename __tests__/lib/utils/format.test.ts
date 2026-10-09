import {
  formatCurrency,
  formatPhoneNumber,
  formatDistance,
  formatOrderNumber,
  truncateText,
  formatRating,
} from '@/lib/utils/format'

describe('Format Utilities', () => {
  describe('formatCurrency', () => {
    it('should format currency in INR', () => {
      expect(formatCurrency(100)).toBe('₹100')
      expect(formatCurrency(1000)).toBe('₹1,000')
      expect(formatCurrency(1234.56)).toBe('₹1,234.56')
    })

    it('should handle zero', () => {
      expect(formatCurrency(0)).toBe('₹0')
    })

    it('should handle negative numbers', () => {
      expect(formatCurrency(-100)).toBe('-₹100')
    })

    it('should round to 2 decimal places', () => {
      expect(formatCurrency(99.999)).toBe('₹100')
      expect(formatCurrency(99.994)).toBe('₹99.99')
    })
  })

  describe('formatPhoneNumber', () => {
    it('should format 10-digit phone numbers', () => {
      expect(formatPhoneNumber('9876543210')).toBe('+91 98765 43210')
    })

    it('should handle phone numbers with special characters', () => {
      expect(formatPhoneNumber('987-654-3210')).toBe('+91 98765 43210')
      expect(formatPhoneNumber('(987) 654-3210')).toBe('+91 98765 43210')
    })

    it('should return original if not 10 digits', () => {
      expect(formatPhoneNumber('123')).toBe('123')
      expect(formatPhoneNumber('12345678901')).toBe('12345678901')
    })
  })

  describe('formatDistance', () => {
    it('should format distances less than 1km in meters', () => {
      expect(formatDistance(0.5)).toBe('500 m')
      expect(formatDistance(0.123)).toBe('123 m')
    })

    it('should format distances >= 1km in kilometers', () => {
      expect(formatDistance(1)).toBe('1.0 km')
      expect(formatDistance(5.678)).toBe('5.7 km')
      expect(formatDistance(10.234)).toBe('10.2 km')
    })

    it('should handle zero distance', () => {
      expect(formatDistance(0)).toBe('0 m')
    })
  })

  describe('formatOrderNumber', () => {
    it('should convert order number to uppercase', () => {
      expect(formatOrderNumber('ord-20240101-1234')).toBe('ORD-20240101-1234')
      expect(formatOrderNumber('ORD-20240101-1234')).toBe('ORD-20240101-1234')
    })
  })

  describe('truncateText', () => {
    it('should truncate text longer than maxLength', () => {
      expect(truncateText('This is a long text', 10)).toBe('This is a ...')
    })

    it('should not truncate text shorter than maxLength', () => {
      expect(truncateText('Short', 10)).toBe('Short')
    })

    it('should handle exact length', () => {
      expect(truncateText('Exact', 5)).toBe('Exact')
    })

    it('should handle empty string', () => {
      expect(truncateText('', 10)).toBe('')
    })
  })

  describe('formatRating', () => {
    it('should format rating to one decimal place', () => {
      expect(formatRating(4.5)).toBe('4.5')
      expect(formatRating(4)).toBe('4.0')
      expect(formatRating(4.567)).toBe('4.6')
    })

    it('should handle zero rating', () => {
      expect(formatRating(0)).toBe('0.0')
    })

    it('should handle maximum rating', () => {
      expect(formatRating(5)).toBe('5.0')
    })
  })
})
