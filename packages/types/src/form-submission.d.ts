export declare enum FormSubmissionStatus {
    DRAFT = "draft",
    IN_PROGRESS = "in_progress",
    SUBMITTED = "submitted",
    REVIEWED = "reviewed",
    APPROVED = "approved",
    REJECTED = "rejected"
}
export declare const VALID_STATUS_TRANSITIONS: Record<FormSubmissionStatus, FormSubmissionStatus[]>;
export declare function isValidStatusTransition(fromStatus: FormSubmissionStatus, toStatus: FormSubmissionStatus): boolean;
export declare function canTransitionToStatus(currentStatus: FormSubmissionStatus, targetStatus: FormSubmissionStatus): {
    allowed: boolean;
    reason?: string;
};
//# sourceMappingURL=form-submission.d.ts.map