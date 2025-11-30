/**
 * SkipLinks Component Tests
 *
 * Tests for skip links accessibility feature.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MantineProvider } from '@mantine/core';
import { SkipLinks } from '../SkipLinks';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MantineProvider>{children}</MantineProvider>
);

describe('SkipLinks', () => {
  beforeEach(() => {
    // Create target elements for skip links
    document.body.innerHTML = `
      <div id="main-content" tabindex="-1">Main content</div>
      <nav id="navigation" tabindex="-1">Navigation</nav>
      <div id="custom-target" tabindex="-1">Custom target</div>
    `;
  });

  describe('rendering', () => {
    it('should render default skip links', () => {
      render(<SkipLinks />, { wrapper });

      expect(screen.getByText('Skip to main content')).toBeInTheDocument();
      expect(screen.getByText('Skip to navigation')).toBeInTheDocument();
    });

    it('should render custom skip links', () => {
      const customLinks = [{ targetId: 'custom-target', label: 'Skip to custom section' }];

      render(<SkipLinks links={customLinks} />, { wrapper });

      expect(screen.getByText('Skip to custom section')).toBeInTheDocument();
      expect(screen.queryByText('Skip to main content')).not.toBeInTheDocument();
    });

    it('should have correct href attributes', () => {
      render(<SkipLinks />, { wrapper });

      const mainContentLink = screen.getByText('Skip to main content');
      const navigationLink = screen.getByText('Skip to navigation');

      expect(mainContentLink).toHaveAttribute('href', '#main-content');
      expect(navigationLink).toHaveAttribute('href', '#navigation');
    });

    it('should have nav role with aria-label', () => {
      render(<SkipLinks />, { wrapper });

      const nav = screen.getByRole('navigation', { name: 'Skip links' });
      expect(nav).toBeInTheDocument();
    });
  });

  describe('interaction', () => {
    it('should focus target element on click', async () => {
      render(<SkipLinks />, { wrapper });
      const user = userEvent.setup();

      const mainContentLink = screen.getByText('Skip to main content');
      await user.click(mainContentLink);

      const mainContent = document.getElementById('main-content');
      expect(document.activeElement).toBe(mainContent);
    });

    it('should scroll target element into view', async () => {
      const scrollIntoViewMock = vi.fn();
      const mainContent = document.getElementById('main-content');
      if (mainContent) {
        mainContent.scrollIntoView = scrollIntoViewMock;
      }

      render(<SkipLinks />, { wrapper });
      const user = userEvent.setup();

      const mainContentLink = screen.getByText('Skip to main content');
      await user.click(mainContentLink);

      expect(scrollIntoViewMock).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'start',
      });
    });

    it('should prevent default link behavior', async () => {
      render(<SkipLinks />, { wrapper });

      const mainContentLink = screen.getByText('Skip to main content');
      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
      });

      const preventDefaultSpy = vi.spyOn(clickEvent, 'preventDefault');
      fireEvent(mainContentLink, clickEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('should be keyboard accessible', async () => {
      render(<SkipLinks />, { wrapper });
      const user = userEvent.setup();

      // Tab to first skip link
      await user.tab();
      expect(screen.getByText('Skip to main content')).toHaveFocus();

      // Tab to second skip link
      await user.tab();
      expect(screen.getByText('Skip to navigation')).toHaveFocus();
    });

    it('should activate with Enter key', async () => {
      render(<SkipLinks />, { wrapper });
      const user = userEvent.setup();

      // Tab to first skip link
      await user.tab();
      expect(screen.getByText('Skip to main content')).toHaveFocus();

      // Press Enter to activate
      await user.keyboard('{Enter}');

      const mainContent = document.getElementById('main-content');
      expect(document.activeElement).toBe(mainContent);
    });
  });

  describe('accessibility', () => {
    it('should have accessible link text', () => {
      render(<SkipLinks />, { wrapper });

      const links = screen.getAllByRole('link');
      links.forEach((link) => {
        expect(link).toHaveAccessibleName();
      });
    });

    it('should handle missing target gracefully', async () => {
      // Remove target element
      const mainContent = document.getElementById('main-content');
      mainContent?.remove();

      render(<SkipLinks />, { wrapper });
      const user = userEvent.setup();

      const mainContentLink = screen.getByText('Skip to main content');

      // Should not throw error when target doesn't exist
      await expect(user.click(mainContentLink)).resolves.not.toThrow();
    });
  });

  describe('styling', () => {
    it('should have absolute positioning', () => {
      render(<SkipLinks />, { wrapper });

      const nav = screen.getByRole('navigation', { name: 'Skip links' });
      expect(nav).toHaveStyle({ position: 'absolute' });
    });

    it('should have high z-index for visibility', () => {
      render(<SkipLinks />, { wrapper });

      const nav = screen.getByRole('navigation', { name: 'Skip links' });
      expect(nav).toHaveStyle({ zIndex: '9999' });
    });
  });
});
