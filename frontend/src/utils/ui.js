import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Helper function to merge Tailwind CSS classes
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Format date strings
export function formatDate(input) {
  const date = input instanceof Date ? input : new Date(input);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

// Format currency
export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

// Format large numbers with commas
export function formatNumber(num) {
  return new Intl.NumberFormat('en-US').format(num);
}

// Truncate text with ellipsis
export function truncateText(text, length = 50) {
  if (!text) return '';
  return text.length > length ? `${text.substring(0, length)}...` : text;
}

// Generate random hexadecimal color
export function getRandomColor() {
  return `#${Math.floor(Math.random() * 16777215).toString(16)}`;
}

// Get initials from name
export function getInitials(name) {
  if (!name) return '';
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase();
}

// Convert file size to human-readable format
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
} 