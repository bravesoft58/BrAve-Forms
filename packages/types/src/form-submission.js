"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VALID_STATUS_TRANSITIONS = exports.FormSubmissionStatus = void 0;
exports.isValidStatusTransition = isValidStatusTransition;
exports.canTransitionToStatus = canTransitionToStatus;
var FormSubmissionStatus;
(function (FormSubmissionStatus) {
    FormSubmissionStatus["DRAFT"] = "draft";
    FormSubmissionStatus["IN_PROGRESS"] = "in_progress";
    FormSubmissionStatus["SUBMITTED"] = "submitted";
    FormSubmissionStatus["REVIEWED"] = "reviewed";
    FormSubmissionStatus["APPROVED"] = "approved";
    FormSubmissionStatus["REJECTED"] = "rejected";
})(FormSubmissionStatus || (exports.FormSubmissionStatus = FormSubmissionStatus = {}));
exports.VALID_STATUS_TRANSITIONS = {
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
function isValidStatusTransition(fromStatus, toStatus) {
    const validTransitions = exports.VALID_STATUS_TRANSITIONS[fromStatus];
    return validTransitions.includes(toStatus);
}
function canTransitionToStatus(currentStatus, targetStatus) {
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
//# sourceMappingURL=form-submission.js.map