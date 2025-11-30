/**
 * Help Search Unit Tests
 *
 * Tests for FAQ fuzzy search functionality using Fuse.js.
 */

import { describe, it, expect } from 'vitest';
import {
  searchFAQs,
  filterByCategory,
  searchAndFilterFAQs,
  getCategories,
  getFAQCountByCategory,
  createFAQSearcher,
} from '../help-search';
import { faqs } from '../help-data';

describe('Help Search', () => {
  describe('searchFAQs', () => {
    it('should return all FAQs when query is empty', () => {
      const results = searchFAQs('');
      expect(results).toHaveLength(faqs.length);
    });

    it('should return all FAQs when query is only whitespace', () => {
      const results = searchFAQs('   ');
      expect(results).toHaveLength(faqs.length);
    });

    it('should find FAQs matching question text', () => {
      const results = searchFAQs('offline');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((faq) => faq.question.toLowerCase().includes('offline'))).toBe(true);
    });

    it('should find FAQs matching answer text', () => {
      // Search for content that appears in FAQ answers
      const results = searchFAQs('automatically stores');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((faq) => faq.answer.toLowerCase().includes('automatically'))).toBe(true);
    });

    it('should find FAQs matching keywords', () => {
      const results = searchFAQs('introduction');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((faq) => faq.keywords.includes('introduction'))).toBe(true);
    });

    it('should find FAQs for EPA compliance query', () => {
      const results = searchFAQs('EPA compliance');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((faq) => faq.category === 'compliance')).toBe(true);
    });

    it('should find FAQs for rain threshold query', () => {
      const results = searchFAQs('0.25 inch rain');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((faq) => faq.answer.includes('0.25'))).toBe(true);
    });

    it('should return fewer results for more specific queries', () => {
      const broadResults = searchFAQs('form');
      const specificResults = searchFAQs('clone form template');
      expect(broadResults.length).toBeGreaterThanOrEqual(specificResults.length);
    });

    it('should use fuzzy matching for typos', () => {
      const results = searchFAQs('offlin'); // Missing 'e'
      expect(results.length).toBeGreaterThan(0);
    });

    it('should return empty array for completely unrelated queries', () => {
      const results = searchFAQs('xyzabc123nonsense');
      expect(results).toHaveLength(0);
    });
  });

  describe('filterByCategory', () => {
    it('should return all items when category is "all"', () => {
      const results = filterByCategory(faqs, 'all');
      expect(results).toHaveLength(faqs.length);
    });

    it('should filter by general category', () => {
      const results = filterByCategory(faqs, 'general');
      expect(results.every((faq) => faq.category === 'general')).toBe(true);
      expect(results.length).toBeGreaterThan(0);
    });

    it('should filter by compliance category', () => {
      const results = filterByCategory(faqs, 'compliance');
      expect(results.every((faq) => faq.category === 'compliance')).toBe(true);
      expect(results.length).toBeGreaterThan(0);
    });

    it('should filter by offline category', () => {
      const results = filterByCategory(faqs, 'offline');
      expect(results.every((faq) => faq.category === 'offline')).toBe(true);
      expect(results.length).toBeGreaterThan(0);
    });

    it('should filter by forms category', () => {
      const results = filterByCategory(faqs, 'forms');
      expect(results.every((faq) => faq.category === 'forms')).toBe(true);
      expect(results.length).toBeGreaterThan(0);
    });

    it('should filter by photos category', () => {
      const results = filterByCategory(faqs, 'photos');
      expect(results.every((faq) => faq.category === 'photos')).toBe(true);
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('searchAndFilterFAQs', () => {
    it('should combine search and filter', () => {
      const results = searchAndFilterFAQs('rain', 'compliance');

      // All results must be in the compliance category
      expect(results.every((faq) => faq.category === 'compliance')).toBe(true);

      // Should find at least one result
      expect(results.length).toBeGreaterThan(0);

      // Results should contain rain-related content (question, answer, or keywords)
      expect(
        results.some(
          (faq) =>
            faq.question.toLowerCase().includes('rain') ||
            faq.answer.toLowerCase().includes('rain') ||
            faq.keywords.some((kw) => kw.toLowerCase().includes('rain'))
        )
      ).toBe(true);

      // Specifically should find the 0.25 inch rain rule FAQ
      expect(results.some((faq) => faq.id === 'compliance-1')).toBe(true);
    });

    it('should return empty when no matches in category', () => {
      // Search for a very specific photo-related term in compliance category
      // Should return empty because EXIF is only mentioned in photos category
      const results = searchAndFilterFAQs('EXIF metadata camera', 'general');
      expect(results).toHaveLength(0);
    });

    it('should apply category filter to all results when query is empty', () => {
      const results = searchAndFilterFAQs('', 'forms');
      expect(results.every((faq) => faq.category === 'forms')).toBe(true);
    });
  });

  describe('getCategories', () => {
    it('should return all unique categories', () => {
      const categories = getCategories();
      expect(categories).toContain('general');
      expect(categories).toContain('forms');
      expect(categories).toContain('compliance');
      expect(categories).toContain('offline');
      expect(categories).toContain('photos');
    });

    it('should not have duplicate categories', () => {
      const categories = getCategories();
      const uniqueCategories = new Set(categories);
      expect(categories.length).toBe(uniqueCategories.size);
    });
  });

  describe('getFAQCountByCategory', () => {
    it('should return count for all categories plus "all"', () => {
      const counts = getFAQCountByCategory();
      expect(counts.all).toBe(faqs.length);
      expect(counts.general).toBeGreaterThan(0);
      expect(counts.forms).toBeGreaterThan(0);
      expect(counts.compliance).toBeGreaterThan(0);
      expect(counts.offline).toBeGreaterThan(0);
      expect(counts.photos).toBeGreaterThan(0);
    });

    it('should have category counts that sum to total', () => {
      const counts = getFAQCountByCategory();
      const categorySum =
        counts.general + counts.forms + counts.compliance + counts.offline + counts.photos;
      expect(categorySum).toBe(counts.all);
    });
  });

  describe('createFAQSearcher', () => {
    it('should create a Fuse instance', () => {
      const searcher = createFAQSearcher();
      expect(searcher).toBeDefined();
      expect(typeof searcher.search).toBe('function');
    });

    it('should allow custom threshold option', () => {
      const strictSearcher = createFAQSearcher({ threshold: 0.1 });
      const lenientSearcher = createFAQSearcher({ threshold: 0.8 });

      // Strict searcher should return fewer results for partial matches
      const strictResults = strictSearcher.search('offlin');
      const lenientResults = lenientSearcher.search('offlin');

      expect(lenientResults.length).toBeGreaterThanOrEqual(strictResults.length);
    });
  });

  describe('FAQ Data Integrity', () => {
    it('should have unique FAQ ids', () => {
      const ids = faqs.map((faq) => faq.id);
      const uniqueIds = new Set(ids);
      expect(ids.length).toBe(uniqueIds.size);
    });

    it('should have non-empty questions', () => {
      expect(faqs.every((faq) => faq.question.trim().length > 0)).toBe(true);
    });

    it('should have non-empty answers', () => {
      expect(faqs.every((faq) => faq.answer.trim().length > 0)).toBe(true);
    });

    it('should have valid categories', () => {
      const validCategories = ['general', 'forms', 'compliance', 'offline', 'photos'];
      expect(faqs.every((faq) => validCategories.includes(faq.category))).toBe(true);
    });

    it('should have at least one keyword per FAQ', () => {
      expect(faqs.every((faq) => faq.keywords.length > 0)).toBe(true);
    });
  });
});
