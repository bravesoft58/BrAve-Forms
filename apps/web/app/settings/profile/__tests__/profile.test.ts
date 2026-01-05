import { describe, it, expect } from 'vitest';
import { calculateProfileCompletion } from '../utils';

describe('calculateProfileCompletion', () => {
  describe('returns correct percentage based on user data', () => {
    it('returns 0% for empty user', () => {
      const user = {};
      expect(calculateProfileCompletion(user)).toBe(0);
    });

    it('returns 20% for user with only first name', () => {
      const user = { firstName: 'John' };
      expect(calculateProfileCompletion(user)).toBe(20);
    });

    it('returns 40% for user with first and last name', () => {
      const user = { firstName: 'John', lastName: 'Doe' };
      expect(calculateProfileCompletion(user)).toBe(40);
    });

    it('returns 60% for user with names and verified email', () => {
      const user = {
        firstName: 'John',
        lastName: 'Doe',
        primaryEmailAddress: {
          verification: { status: 'verified' },
        },
      };
      expect(calculateProfileCompletion(user)).toBe(60);
    });

    it('returns 80% for user with names, email, and phone', () => {
      const user = {
        firstName: 'John',
        lastName: 'Doe',
        primaryEmailAddress: {
          verification: { status: 'verified' },
        },
        phoneNumbers: [{ phoneNumber: '+1234567890' }],
      };
      expect(calculateProfileCompletion(user)).toBe(80);
    });

    it('returns 100% for complete profile with hasImage', () => {
      const user = {
        firstName: 'John',
        lastName: 'Doe',
        hasImage: true,
        primaryEmailAddress: {
          verification: { status: 'verified' },
        },
        phoneNumbers: [{ phoneNumber: '+1234567890' }],
      };
      expect(calculateProfileCompletion(user)).toBe(100);
    });

    it('returns 100% for complete profile with custom imageUrl', () => {
      const user = {
        firstName: 'John',
        lastName: 'Doe',
        imageUrl: 'https://example.com/avatar.jpg',
        primaryEmailAddress: {
          verification: { status: 'verified' },
        },
        phoneNumbers: [{ phoneNumber: '+1234567890' }],
      };
      expect(calculateProfileCompletion(user)).toBe(100);
    });
  });

  describe('edge cases', () => {
    it('ignores whitespace-only first name', () => {
      const user = { firstName: '   ', lastName: 'Doe' };
      expect(calculateProfileCompletion(user)).toBe(20);
    });

    it('ignores whitespace-only last name', () => {
      const user = { firstName: 'John', lastName: '   ' };
      expect(calculateProfileCompletion(user)).toBe(20);
    });

    it('ignores null values', () => {
      const user = {
        firstName: null,
        lastName: null,
        imageUrl: null,
        primaryEmailAddress: null,
        phoneNumbers: null,
      };
      expect(calculateProfileCompletion(user)).toBe(0);
    });

    it('does not count unverified email', () => {
      const user = {
        firstName: 'John',
        lastName: 'Doe',
        primaryEmailAddress: {
          verification: { status: 'pending' },
        },
      };
      expect(calculateProfileCompletion(user)).toBe(40);
    });

    it('does not count email with null status', () => {
      const user = {
        firstName: 'John',
        lastName: 'Doe',
        primaryEmailAddress: {
          verification: { status: null },
        },
      };
      expect(calculateProfileCompletion(user)).toBe(40);
    });

    it('does not count default Clerk avatar', () => {
      const user = {
        firstName: 'John',
        lastName: 'Doe',
        imageUrl: 'https://img.clerk.com/default/avatar.png',
        hasImage: false,
      };
      expect(calculateProfileCompletion(user)).toBe(40);
    });

    it('does not count empty phone numbers array', () => {
      const user = {
        firstName: 'John',
        lastName: 'Doe',
        phoneNumbers: [],
      };
      expect(calculateProfileCompletion(user)).toBe(40);
    });

    it('does not count phone number without value', () => {
      const user = {
        firstName: 'John',
        lastName: 'Doe',
        phoneNumbers: [{ phoneNumber: undefined }],
      };
      expect(calculateProfileCompletion(user)).toBe(40);
    });
  });

  describe('real-world scenarios', () => {
    it('handles typical new user (just signed up via SSO)', () => {
      const user = {
        firstName: 'Jane',
        lastName: 'Smith',
        imageUrl: 'https://lh3.googleusercontent.com/a/avatar.jpg',
        primaryEmailAddress: {
          verification: { status: 'verified' },
        },
        phoneNumbers: [],
      };
      // Has name (40%), has image (20%), verified email (20%) = 80%
      expect(calculateProfileCompletion(user)).toBe(80);
    });

    it('handles field worker with complete profile', () => {
      const user = {
        firstName: 'Mike',
        lastName: 'Johnson',
        hasImage: true,
        imageUrl: 'https://example.com/mike.jpg',
        primaryEmailAddress: {
          verification: { status: 'verified' },
        },
        phoneNumbers: [{ phoneNumber: '+1-555-123-4567' }],
      };
      expect(calculateProfileCompletion(user)).toBe(100);
    });

    it('handles admin who skipped optional fields', () => {
      const user = {
        firstName: 'Admin',
        lastName: 'User',
        primaryEmailAddress: {
          verification: { status: 'verified' },
        },
      };
      // Name (40%) + verified email (20%) = 60%
      expect(calculateProfileCompletion(user)).toBe(60);
    });
  });
});
