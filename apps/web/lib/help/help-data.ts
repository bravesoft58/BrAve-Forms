/**
 * Help & Documentation Data
 *
 * Centralized content for the help page including FAQs, tutorials, and compliance guides.
 * This file supports fuzzy search via Fuse.js.
 */

export type FAQCategory = 'forms' | 'compliance' | 'offline' | 'photos' | 'general';

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: FAQCategory;
  keywords: string[];
}

export interface Tutorial {
  id: string;
  title: string;
  description: string;
  duration: string;
  videoUrl: string;
  thumbnailUrl?: string;
  category: 'getting-started' | 'forms' | 'compliance' | 'photos' | 'offline';
}

export interface ComplianceGuide {
  id: string;
  title: string;
  description: string;
  pdfUrl: string;
  category: 'epa' | 'osha' | 'state' | 'general';
  lastUpdated: string;
}

/**
 * Frequently Asked Questions
 *
 * Organized by category for construction field workers and compliance managers.
 */
export const faqs: FAQ[] = [
  // General
  {
    id: 'general-1',
    question: 'What is BrAve Forms?',
    answer:
      'BrAve Forms is a construction forms management platform designed for field workers. It helps you fill out EPA/OSHA compliance forms, capture photos with GPS, and work offline for up to 30 days. Everything syncs automatically when you reconnect.',
    category: 'general',
    keywords: ['introduction', 'about', 'what is', 'overview'],
  },
  {
    id: 'general-2',
    question: 'How do I get started?',
    answer:
      'After logging in, go to the Dashboard to see your active projects. Select a project to view its forms. Tap any form to start filling it out. Your work is automatically saved as you type.',
    category: 'general',
    keywords: ['start', 'begin', 'first time', 'new user'],
  },
  {
    id: 'general-3',
    question: 'Can I use BrAve Forms on my phone?',
    answer:
      'Yes, BrAve Forms works on smartphones, tablets, and desktop computers. For the best field experience, install the mobile app which includes offline support and camera integration for compliance photos.',
    category: 'general',
    keywords: ['mobile', 'phone', 'tablet', 'device'],
  },

  // Offline
  {
    id: 'offline-1',
    question: 'How do I work offline for 30 days?',
    answer:
      'BrAve Forms automatically stores all data locally. You can continue filling forms, uploading photos, and marking inspections complete without internet for up to 30 days. When you reconnect, everything syncs automatically. Look for the green checkmark in the sync indicator to confirm your data is synced.',
    category: 'offline',
    keywords: ['offline', 'no internet', 'field', 'connectivity', 'sync'],
  },
  {
    id: 'offline-2',
    question: 'What happens when I reconnect to the internet?',
    answer:
      'When you reconnect, BrAve Forms automatically syncs all your pending changes. You will see a sync indicator showing progress. Any conflicts (rare) are flagged for your review. Most syncs complete within 2 minutes.',
    category: 'offline',
    keywords: ['sync', 'upload', 'reconnect', 'internet'],
  },
  {
    id: 'offline-3',
    question: 'How do I know if my data is synced?',
    answer:
      'Check the sync indicator in the top navigation bar. A green checkmark means all data is synced. An orange icon means changes are pending. You can also see the last sync time by tapping the indicator.',
    category: 'offline',
    keywords: ['sync status', 'indicator', 'pending', 'uploaded'],
  },
  {
    id: 'offline-4',
    question: 'Can I still see my forms offline?',
    answer:
      'Yes, all forms you have accessed are cached locally. You can view, edit, and submit forms while offline. New form templates are downloaded when you sync.',
    category: 'offline',
    keywords: ['cache', 'local', 'storage', 'view offline'],
  },

  // Compliance
  {
    id: 'compliance-1',
    question: 'What is the 0.25 inch rain rule?',
    answer:
      'EPA CGP requires construction sites to conduct inspections within 24 hours (during working hours) after any storm event producing 0.25 inches or more of rain within 24 hours. BrAve Forms monitors weather automatically and alerts you when inspections are due.',
    category: 'compliance',
    keywords: ['rain', 'epa', 'cgp', 'inspection', 'storm', 'weather', '0.25'],
  },
  {
    id: 'compliance-2',
    question: 'How does weather monitoring work?',
    answer:
      'BrAve Forms monitors NOAA weather data for your project locations. When precipitation exceeds 0.25 inches, you receive an alert to conduct an inspection within 24 working hours. The system tracks storm accumulation and multiple events.',
    category: 'compliance',
    keywords: ['weather', 'noaa', 'monitoring', 'alert', 'precipitation'],
  },
  {
    id: 'compliance-3',
    question: 'What is a SWPPP?',
    answer:
      'A Stormwater Pollution Prevention Plan (SWPPP) is required by EPA for construction sites over 1 acre. It documents your erosion and sediment control measures. BrAve Forms helps you track SWPPP inspections and maintain compliance records.',
    category: 'compliance',
    keywords: ['swppp', 'stormwater', 'pollution', 'prevention', 'plan'],
  },
  {
    id: 'compliance-4',
    question: 'How often do I need to inspect my site?',
    answer:
      'EPA CGP requires routine inspections at least every 7 days, AND within 24 hours (during normal working hours) after storm events producing 0.25 inches of rain. Sites near sensitive waters may require more frequent inspections.',
    category: 'compliance',
    keywords: ['inspection', 'frequency', 'schedule', '7 days', 'routine'],
  },
  {
    id: 'compliance-5',
    question: 'What are the penalties for non-compliance?',
    answer:
      'EPA penalties for CGP violations can range from $25,000 to $50,000 per day. BrAve Forms helps you maintain accurate records and meet inspection deadlines to avoid costly fines.',
    category: 'compliance',
    keywords: ['penalty', 'fine', 'violation', 'enforcement'],
  },

  // Forms
  {
    id: 'forms-1',
    question: 'How do I fill out a form?',
    answer:
      'Navigate to your project, then select the form you need. Fill in each field as you go. Required fields are marked with an asterisk (*). Tap Save Draft to save your progress, or Submit when complete.',
    category: 'forms',
    keywords: ['fill', 'complete', 'submit', 'fields'],
  },
  {
    id: 'forms-2',
    question: 'Can I save a form as a draft?',
    answer:
      'Yes, tap Save Draft at any time to save your progress. Drafts are stored locally and sync when you have internet. You can return to drafts from the Forms page.',
    category: 'forms',
    keywords: ['draft', 'save', 'progress', 'later'],
  },
  {
    id: 'forms-3',
    question: 'How do I clone a form?',
    answer:
      'From the form list, tap the three-dot menu next to any completed form and select Clone. This creates a new form with the same data, useful for routine inspections with similar conditions.',
    category: 'forms',
    keywords: ['clone', 'copy', 'duplicate', 'template'],
  },
  {
    id: 'forms-4',
    question: 'What form templates are available?',
    answer:
      'BrAve Forms includes 50+ construction templates including EPA CGP inspections, OSHA safety checklists, daily reports, and state-specific forms. Contact support if you need custom templates.',
    category: 'forms',
    keywords: ['template', 'type', 'category', 'available'],
  },
  {
    id: 'forms-5',
    question: 'How do I export a form to PDF?',
    answer:
      'Open any submitted form and tap the Export button. Choose PDF format to download a professional report. PDFs include all form data, photos, and signatures.',
    category: 'forms',
    keywords: ['export', 'pdf', 'download', 'report', 'print'],
  },

  // Photos
  {
    id: 'photos-1',
    question: 'How do I add GPS location to photos?',
    answer:
      'When taking photos with the BrAve Forms mobile app, GPS coordinates are automatically embedded in the photo EXIF data. Make sure location permissions are enabled. You can view photo locations on the map in the Photos section.',
    category: 'photos',
    keywords: ['gps', 'location', 'geotag', 'exif', 'coordinates'],
  },
  {
    id: 'photos-2',
    question: 'How many photos can I upload?',
    answer:
      'There is no limit on photos per form or project. Photos are compressed automatically to save storage and bandwidth. Original quality is preserved for compliance documentation.',
    category: 'photos',
    keywords: ['limit', 'upload', 'storage', 'capacity'],
  },
  {
    id: 'photos-3',
    question: 'Can I annotate photos?',
    answer:
      'Yes, after taking or uploading a photo, tap the Edit button to add annotations. You can draw arrows, circles, and add text to highlight issues. Annotations are saved with the photo.',
    category: 'photos',
    keywords: ['annotate', 'draw', 'markup', 'edit', 'highlight'],
  },
  {
    id: 'photos-4',
    question: 'How do before/after photo pairs work?',
    answer:
      'When documenting corrections, use the Before/After feature. Take a "before" photo showing the issue, then a matching "after" photo showing the correction. Photos are linked together in reports.',
    category: 'photos',
    keywords: ['before', 'after', 'pair', 'correction', 'comparison'],
  },
  {
    id: 'photos-5',
    question: 'Where are my photos stored?',
    answer:
      'Photos are stored locally on your device and synced to secure cloud storage when online. You can access all your project photos from any device after syncing.',
    category: 'photos',
    keywords: ['storage', 'cloud', 'backup', 'access'],
  },
];

/**
 * Video Tutorials
 *
 * Embedded video content for training and onboarding.
 * Note: videoUrl should be YouTube/Vimeo embed URLs.
 */
export const tutorials: Tutorial[] = [
  {
    id: 'tutorial-1',
    title: 'Getting Started with BrAve Forms',
    description:
      'Learn the basics of navigating BrAve Forms, accessing your projects, and filling out your first form.',
    duration: '5:30',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Placeholder
    category: 'getting-started',
  },
  {
    id: 'tutorial-2',
    title: 'EPA Compliance Inspections',
    description:
      'Step-by-step guide to completing EPA CGP stormwater inspections, including the 0.25 inch rain rule.',
    duration: '8:15',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Placeholder
    category: 'compliance',
  },
  {
    id: 'tutorial-3',
    title: 'Taking Compliance Photos',
    description:
      'Best practices for capturing photos with GPS location, annotations, and before/after comparisons.',
    duration: '6:45',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Placeholder
    category: 'photos',
  },
  {
    id: 'tutorial-4',
    title: 'Working Offline in the Field',
    description: 'How to use BrAve Forms without internet and sync your data when you reconnect.',
    duration: '4:20',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Placeholder
    category: 'offline',
  },
  {
    id: 'tutorial-5',
    title: 'Using Form Templates',
    description:
      'Explore available templates, clone forms, and customize inspections for your projects.',
    duration: '7:00',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Placeholder
    category: 'forms',
  },
];

/**
 * Compliance Guides
 *
 * Downloadable PDF guides for EPA/OSHA regulations.
 * Note: pdfUrl should point to actual hosted PDF files.
 */
export const complianceGuides: ComplianceGuide[] = [
  {
    id: 'guide-1',
    title: 'EPA CGP 2022 Quick Reference',
    description:
      'Summary of EPA Construction General Permit requirements including the 0.25 inch rain inspection rule, SWPPP requirements, and inspection schedules.',
    pdfUrl: '/guides/epa-cgp-2022-quick-reference.pdf',
    category: 'epa',
    lastUpdated: '2024-01-15',
  },
  {
    id: 'guide-2',
    title: 'OSHA Construction Safety Checklist',
    description:
      'Daily safety inspection requirements for construction sites including fall protection, scaffolding, and excavation.',
    pdfUrl: '/guides/osha-construction-safety-checklist.pdf',
    category: 'osha',
    lastUpdated: '2024-02-20',
  },
  {
    id: 'guide-3',
    title: 'Stormwater Inspection Best Practices',
    description:
      'Field guide for conducting effective stormwater inspections with photo documentation tips.',
    pdfUrl: '/guides/stormwater-inspection-best-practices.pdf',
    category: 'epa',
    lastUpdated: '2024-03-10',
  },
  {
    id: 'guide-4',
    title: 'BMP Installation and Maintenance',
    description:
      'Guide to Best Management Practices for erosion and sediment control on construction sites.',
    pdfUrl: '/guides/bmp-installation-maintenance.pdf',
    category: 'epa',
    lastUpdated: '2024-01-30',
  },
  {
    id: 'guide-5',
    title: 'Site Inspection Report Writing',
    description:
      'How to write clear, compliant inspection reports that meet regulatory requirements.',
    pdfUrl: '/guides/inspection-report-writing.pdf',
    category: 'general',
    lastUpdated: '2024-04-05',
  },
];

/**
 * Category labels for display
 */
export const faqCategoryLabels: Record<FAQCategory, string> = {
  forms: 'Forms & Templates',
  compliance: 'EPA/OSHA Compliance',
  offline: 'Offline & Sync',
  photos: 'Photos & GPS',
  general: 'General',
};

export const tutorialCategoryLabels: Record<Tutorial['category'], string> = {
  'getting-started': 'Getting Started',
  forms: 'Forms & Templates',
  compliance: 'EPA/OSHA Compliance',
  photos: 'Photos & GPS',
  offline: 'Offline & Sync',
};

export const guideCategoryLabels: Record<ComplianceGuide['category'], string> = {
  epa: 'EPA Regulations',
  osha: 'OSHA Safety',
  state: 'State Requirements',
  general: 'General Guides',
};
