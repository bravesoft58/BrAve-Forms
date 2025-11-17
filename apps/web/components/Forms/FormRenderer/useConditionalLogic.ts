import { FormField } from './types';

/**
 * Evaluate conditional logic for field visibility
 *
 * @param field - Field with optional conditional logic
 * @param formValues - Current form values from React Hook Form watch()
 * @returns Whether field should be visible
 */
export function evaluateConditionalLogic(
  field: FormField,
  formValues: Record<string, any>
): boolean {
  // No conditional logic - always visible
  if (!field.conditional?.showIf) {
    return true;
  }

  const { showIf } = field.conditional;
  const targetValue = formValues[showIf.field];

  // Evaluate condition based on operator
  switch (showIf.operator) {
    case 'equals':
      return targetValue === showIf.value;

    case 'notEquals':
      return targetValue !== showIf.value;

    case 'contains':
      if (typeof targetValue === 'string') {
        return targetValue.includes(String(showIf.value));
      }
      if (Array.isArray(targetValue)) {
        return targetValue.includes(showIf.value);
      }
      return false;

    case 'greaterThan':
      return Number(targetValue) > Number(showIf.value);

    case 'lessThan':
      return Number(targetValue) < Number(showIf.value);

    default:
      console.warn(`Unknown conditional operator: ${showIf.operator}`);
      return true;
  }
}

/**
 * Hook wrapper for useConditionalLogic (for backward compatibility with tests)
 * @deprecated Use evaluateConditionalLogic directly
 */
export function useConditionalLogic(
  field: FormField,
  formValues: Record<string, any>
): { isVisible: boolean } {
  return { isVisible: evaluateConditionalLogic(field, formValues) };
}

