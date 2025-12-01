// BrAve Forms Landing Page Configuration
// Environment-based URLs for authentication redirects

const appUrl = import.meta.env.VITE_APP_URL || 'https://forms.brave-soft.com';

export const config = {
  appUrl,
  signInUrl: `${appUrl}/sign-in`,
  signUpUrl: `${appUrl}/sign-up`,
  contactEmail: 'sales@brave-soft.com',
};
