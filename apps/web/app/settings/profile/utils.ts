/**
 * Calculate profile completion percentage based on user data
 * Criteria:
 * - First name (20%)
 * - Last name (20%)
 * - Profile image (20%)
 * - Email verified (20%)
 * - Phone number (20%)
 */
export function calculateProfileCompletion(user: {
  firstName?: string | null;
  lastName?: string | null;
  imageUrl?: string | null;
  hasImage?: boolean;
  primaryEmailAddress?: { verification?: { status: string | null } | null } | null;
  phoneNumbers?: Array<{ phoneNumber?: string }> | null;
}): number {
  let score = 0;

  // First name (20%)
  if (user.firstName && user.firstName.trim() !== '') {
    score += 20;
  }

  // Last name (20%)
  if (user.lastName && user.lastName.trim() !== '') {
    score += 20;
  }

  // Profile image (20%) - check hasImage or if imageUrl is not the default Clerk avatar
  if (user.hasImage || (user.imageUrl && !user.imageUrl.includes('img.clerk.com/default'))) {
    score += 20;
  }

  // Email verified (20%)
  if (user.primaryEmailAddress?.verification?.status === 'verified') {
    score += 20;
  }

  // Phone number (20%)
  if (user.phoneNumbers && user.phoneNumbers.length > 0 && user.phoneNumbers[0]?.phoneNumber) {
    score += 20;
  }

  return score;
}
