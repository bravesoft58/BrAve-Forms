'use client';

import { Breadcrumbs as MantineBreadcrumbs, Anchor, Text, rem } from '@mantine/core';
import Link from 'next/link';
import { useMediaQuery } from '@/lib/hooks/use-media-query';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

/**
 * Breadcrumbs Component
 *
 * Hierarchical navigation component that shows the current page's location in the site structure.
 *
 * Features:
 * - Dynamic breadcrumb generation from items array
 * - Clickable links to navigate up hierarchy
 * - Mobile optimization: Shows only last 2 crumbs on small screens
 * - Desktop: Shows full path
 * - Compact sizing: 11px text following ISSUE-078 standards
 *
 * Example:
 * Home > Projects > Project Name > Forms
 *
 * Design: Compact sizing (11px text, 4px separator margin) following ISSUE-078 standards
 */
export function Breadcrumbs({ items }: BreadcrumbsProps) {
  const isMobile = useMediaQuery('(max-width: 768px)');

  // On mobile, show only last 2 items to save space
  // On desktop, show full path
  const visibleItems = isMobile && items.length > 2 ? items.slice(-2) : items;

  return (
    <MantineBreadcrumbs
      separator=">"
      separatorMargin={rem(4)}
      styles={{
        root: {
          fontSize: rem(11),
          lineHeight: 1.4,
        },
        separator: {
          fontSize: rem(11),
          color: 'var(--mantine-color-dimmed)',
        },
      }}
    >
      {visibleItems.map((item, index) => {
        const isLast = index === visibleItems.length - 1;

        // Last item or item without href is not clickable
        if (isLast || !item.href) {
          return (
            <Text
              key={`${item.label}-${index}`}
              c="dimmed"
              style={{
                fontSize: rem(11),
                lineHeight: 1.4,
                fontWeight: isLast ? 600 : 500,
              }}
            >
              {item.label}
            </Text>
          );
        }

        // Clickable breadcrumb item
        return (
          <Anchor
            key={`${item.label}-${index}`}
            component={Link}
            href={item.href}
            underline="hover"
            c="blue.6"
            style={{
              fontSize: rem(11),
              lineHeight: 1.4,
              fontWeight: 500,
            }}
          >
            {item.label}
          </Anchor>
        );
      })}
    </MantineBreadcrumbs>
  );
}
