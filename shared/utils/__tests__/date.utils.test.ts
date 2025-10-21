import { formatTime, formatRelativeDate, isToday, isWithinMinutes } from '../date.utils';

describe('date.utils', () => {
  describe('formatTime', () => {
    it('should format timestamp to time string', () => {
      const timestamp = new Date('2025-10-21T14:30:00').getTime();
      const result = formatTime(timestamp);
      
      // Result will vary based on locale, but should contain time
      expect(result).toMatch(/\d{1,2}:\d{2}/);
    });
  });

  describe('formatRelativeDate', () => {
    it('should return time for today', () => {
      const now = Date.now();
      const result = formatRelativeDate(now);
      
      expect(result).toMatch(/\d{1,2}:\d{2}/);
    });

    it('should return "Yesterday" for yesterday', () => {
      const yesterday = Date.now() - (24 * 60 * 60 * 1000);
      const result = formatRelativeDate(yesterday);
      
      expect(result).toBe('Yesterday');
    });

    it('should return weekday for recent dates', () => {
      const threeDaysAgo = Date.now() - (3 * 24 * 60 * 60 * 1000);
      const result = formatRelativeDate(threeDaysAgo);
      
      // Should be a weekday abbreviation
      expect(result.length).toBeGreaterThan(0);
      expect(result.length).toBeLessThan(10);
    });
  });

  describe('isToday', () => {
    it('should return true for current timestamp', () => {
      const now = Date.now();
      expect(isToday(now)).toBe(true);
    });

    it('should return false for yesterday', () => {
      const yesterday = Date.now() - (24 * 60 * 60 * 1000);
      expect(isToday(yesterday)).toBe(false);
    });
  });

  describe('isWithinMinutes', () => {
    it('should return true if within specified minutes', () => {
      const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
      expect(isWithinMinutes(fiveMinutesAgo, 10)).toBe(true);
    });

    it('should return false if beyond specified minutes', () => {
      const twentyMinutesAgo = Date.now() - (20 * 60 * 1000);
      expect(isWithinMinutes(twentyMinutesAgo, 10)).toBe(false);
    });
  });
});
