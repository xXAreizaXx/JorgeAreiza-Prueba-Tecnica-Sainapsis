import { truncate, capitalize, sanitizeInput, highlightSearchTerm } from '../string.utils';

describe('string.utils', () => {
  describe('truncate', () => {
    it('should truncate long text', () => {
      const text = 'This is a very long text that needs to be truncated';
      const result = truncate(text, 20);
      
      expect(result).toBe('This is a very long ...');
      expect(result.length).toBe(23); // 20 + '...'
    });

    it('should not truncate short text', () => {
      const text = 'Short text';
      const result = truncate(text, 20);
      
      expect(result).toBe('Short text');
    });
  });

  describe('capitalize', () => {
    it('should capitalize first letter', () => {
      expect(capitalize('hello')).toBe('Hello');
    });

    it('should handle empty string', () => {
      expect(capitalize('')).toBe('');
    });

    it('should not change already capitalized text', () => {
      expect(capitalize('Hello')).toBe('Hello');
    });
  });

  describe('sanitizeInput', () => {
    it('should trim whitespace', () => {
      expect(sanitizeInput('  hello  ')).toBe('hello');
    });

    it('should replace multiple spaces with single space', () => {
      expect(sanitizeInput('hello    world')).toBe('hello world');
    });

    it('should handle mixed whitespace', () => {
      expect(sanitizeInput('  hello   world  ')).toBe('hello world');
    });
  });

  describe('highlightSearchTerm', () => {
    it('should highlight search term', () => {
      const text = 'Hello world';
      const result = highlightSearchTerm(text, 'world');
      
      expect(result).toBe('Hello <mark>world</mark>');
    });

    it('should be case insensitive', () => {
      const text = 'Hello World';
      const result = highlightSearchTerm(text, 'world');
      
      expect(result).toBe('Hello <mark>World</mark>');
    });

    it('should return original text if no search term', () => {
      const text = 'Hello world';
      const result = highlightSearchTerm(text, '');
      
      expect(result).toBe('Hello world');
    });
  });
});
