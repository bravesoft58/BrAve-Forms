/**
 * Help Search Utility
 *
 * Provides fuzzy search functionality for help content using Fuse.js.
 * Supports searching across FAQs with configurable threshold.
 */

import Fuse, { type IFuseOptions } from 'fuse.js';
import { faqs, type FAQ } from './help-data';

/**
 * Default Fuse.js options for FAQ search
 */
const defaultFuseOptions: IFuseOptions<FAQ> = {
  keys: [
    { name: 'question', weight: 0.4 },
    { name: 'answer', weight: 0.3 },
    { name: 'keywords', weight: 0.3 },
  ],
  threshold: 0.4,
  includeScore: true,
  ignoreLocation: true,
  minMatchCharLength: 2,
};

/**
 * Create a Fuse instance for FAQ search
 */
export function createFAQSearcher(options?: Partial<IFuseOptions<FAQ>>): Fuse<FAQ> {
  return new Fuse(faqs, { ...defaultFuseOptions, ...options });
}

/**
 * Search FAQs with fuzzy matching
 *
 * @param query - Search query string
 * @param options - Optional Fuse.js options override
 * @returns Filtered FAQs matching the query, or all FAQs if query is empty
 */
export function searchFAQs(query: string, options?: Partial<IFuseOptions<FAQ>>): FAQ[] {
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    return faqs;
  }

  const fuse = createFAQSearcher(options);
  const results = fuse.search(trimmedQuery);

  return results.map((result) => result.item);
}

/**
 * Filter FAQs by category
 *
 * @param items - FAQs to filter
 * @param category - Category to filter by, or 'all' for no filtering
 * @returns Filtered FAQs
 */
export function filterByCategory(items: FAQ[], category: FAQ['category'] | 'all'): FAQ[] {
  if (category === 'all') {
    return items;
  }

  return items.filter((item) => item.category === category);
}

/**
 * Combined search and filter
 *
 * @param query - Search query string
 * @param category - Category filter
 * @returns Filtered and searched FAQs
 */
export function searchAndFilterFAQs(query: string, category: FAQ['category'] | 'all'): FAQ[] {
  const searchResults = searchFAQs(query);
  return filterByCategory(searchResults, category);
}

/**
 * Get unique categories from FAQs
 */
export function getCategories(): FAQ['category'][] {
  const categories = new Set(faqs.map((faq) => faq.category));
  return Array.from(categories);
}

/**
 * Category count type
 */
type FAQCategoryCounts = Record<FAQ['category'] | 'all', number>;

/**
 * Get FAQ count by category
 */
export function getFAQCountByCategory(): FAQCategoryCounts {
  const counts: FAQCategoryCounts = {
    all: faqs.length,
    general: 0,
    forms: 0,
    compliance: 0,
    offline: 0,
    photos: 0,
  };

  for (const faq of faqs) {
    counts[faq.category] = counts[faq.category] + 1;
  }

  return counts;
}
