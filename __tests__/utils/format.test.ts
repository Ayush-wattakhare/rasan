import { 
  formatCurrency, 
  formatPhoneNumber, 
  formatDistance, 
  truncateText, 
  formatRating 
} from '@/lib/utils/format';

describe('format utilities', () => {
  describe('formatCurrency', () => {
    it('formats numbers as INR currency', () => {
      // Note: Intl formatting can have non-breaking spaces or different representations depending on environment
      // We check if it contains the currency code or symbol and the number
      const result = formatCurrency(1000);
      expect(result).toMatch(/₹/);
      expect(result).toMatch(/1,000/);
    });

    it('handles decimal values', () => {
      const result = formatCurrency(1234.56);
      expect(result).toMatch(/1,234.56/);
    });
  });

  describe('formatPhoneNumber', () => {
    it('formats 10-digit Indian phone numbers', () => {
      expect(formatPhoneNumber('9876543210')).toBe('+91 98765 43210');
    });

    it('returns original string if not 10 digits', () => {
      expect(formatPhoneNumber('12345')).toBe('12345');
    });
  });

  describe('formatDistance', () => {
    it('formats distances less than 1km as meters', () => {
      expect(formatDistance(0.5)).toBe('500 m');
      expect(formatDistance(0.125)).toBe('125 m');
    });

    it('formats distances 1km or more as kilometers', () => {
      expect(formatDistance(1.5)).toBe('1.5 km');
      expect(formatDistance(10)).toBe('10.0 km');
    });
  });

  describe('truncateText', () => {
    it('truncates text longer than maxLength', () => {
      expect(truncateText('Hello World', 5)).toBe('Hello...');
    });

    it('returns original text if shorter than maxLength', () => {
      expect(truncateText('Hello', 10)).toBe('Hello');
    });
  });

  describe('formatRating', () => {
    it('formats rating to one decimal place', () => {
      expect(formatRating(4)).toBe('4.0');
      expect(formatRating(4.56)).toBe('4.6');
    });
  });
});
