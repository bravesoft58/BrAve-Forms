export enum FormSubmissionStatus {
  DRAFT = 'draft',
  IN_PROGRESS = 'in_progress',
  SUBMITTED = 'submitted',
  REVIEWED = 'reviewed',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export const VALID_STATUS_TRANSITIONS: Record<
  FormSubmissionStatus,
  FormSubmissionStatus[]
> = {
  [FormSubmissionStatus.DRAFT]: [
    FormSubmissionStatus.IN_PROGRESS,
    FormSubmissionStatus.SUBMITTED,
  ],
  [FormSubmissionStatus.IN_PROGRESS]: [
    FormSubmissionStatus.SUBMITTED,
    FormSubmissionStatus.DRAFT,
  ],
  [FormSubmissionStatus.SUBMITTED]: [
    FormSubmissionStatus.REVIEWED,
    FormSubmissionStatus.APPROVED,
    FormSubmissionStatus.REJECTED,
  ],
  [FormSubmissionStatus.REVIEWED]: [
    FormSubmissionStatus.APPROVED,
    FormSubmissionStatus.REJECTED,
  ],
  [FormSubmissionStatus.APPROVED]: [],
  [FormSubmissionStatus.REJECTED]: [FormSubmissionStatus.DRAFT],
};

export function isValidStatusTransition(
  fromStatus: FormSubmissionStatus,
  toStatus: FormSubmissionStatus
): boolean {
  const validTransitions = VALID_STATUS_TRANSITIONS[fromStatus];
  return validTransitions.includes(toStatus);
}

export function canTransitionToStatus(
  currentStatus: FormSubmissionStatus,
  targetStatus: FormSubmissionStatus
): { allowed: boolean; reason?: string } {
  if (currentStatus === targetStatus) {
    return { allowed: false, reason: 'Status is already set to target status' };
  }

  const isValid = isValidStatusTransition(currentStatus, targetStatus);

  if (!isValid) {
    return {
      allowed: false,
      reason: `Cannot transition from ${currentStatus} to ${targetStatus}`,
    };
  }

  return { allowed: true };
}
