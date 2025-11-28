/**
 * Shared formatting utilities for BrAve Forms
 *
 * These utilities are used across photo components and other areas
 * requiring consistent formatting of file sizes and dates.
 */

/**
 * Format file size in human-readable format
 *
 * @param bytes - File size in bytes
 * @returns Formatted string (e.g., "1.5 MB", "256 KB", "512 B")
 *
 * @example
 * formatFileSize(1024000) // "1000.0 KB"
 * formatFileSize(1048576) // "1.0 MB"
 * formatFileSize(512) // "512 B"
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Format date for display in US locale
 *
 * @param dateString - ISO date string
 * @returns Formatted date string (e.g., "Nov 28, 2025")
 *
 * @example
 * formatDate("2025-11-28T10:00:00Z") // "Nov 28, 2025"
 * formatDate("invalid") // "Unknown date"
 */
export function formatDate(dateString: string): string {
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return 'Unknown date';
  }
}
