import { FormField } from './types';

/**
 * Evaluate computed field formulas
 *
 * Supports:
 * - SUM(field1, field2, ...)
 * - COUNT(field1, field2, ...)
 * - AVERAGE(field1, field2, ...)
 * - Template variables: {{currentDate}}, {{currentTime}}, {{userName}}
 *
 * @param field - Field with computedValue formula
 * @param formValues - Current form values from React Hook Form watch()
 * @param userName - Current user name (from auth context)
 * @returns Computed value
 */
export function evaluateComputedField(
  field: FormField,
  formValues: Record<string, any>,
  userName?: string
): any {
  if (!field.computedValue) {
    return undefined;
  }

  const formula = field.computedValue.trim();

  // SUM formula: SUM(field1, field2, field3)
  if (formula.startsWith('SUM(')) {
    const fieldIds = extractFieldIds(formula);
    const values = fieldIds.map((id) => Number(formValues[id] || 0));
    return values.reduce((acc, val) => acc + val, 0);
  }

  // COUNT formula: COUNT(field1, field2, field3)
  if (formula.startsWith('COUNT(')) {
    const fieldIds = extractFieldIds(formula);
    const values = fieldIds.map((id) => formValues[id]);
    return values.filter((v) => v !== undefined && v !== null && v !== '').length;
  }

  // AVERAGE formula: AVERAGE(field1, field2, field3)
  if (formula.startsWith('AVERAGE(')) {
    const fieldIds = extractFieldIds(formula);
    const values = fieldIds.map((id) => Number(formValues[id] || 0));
    const sum = values.reduce((acc, val) => acc + val, 0);
    return values.length > 0 ? sum / values.length : 0;
  }

  // Template variables: {{currentDate}}, {{currentTime}}, {{userName}}
  if (formula.includes('{{')) {
    let result = formula;

    result = result.replace(/\{\{currentDate\}\}/g, formatCurrentDate());
    result = result.replace(/\{\{currentTime\}\}/g, formatCurrentTime());
    result = result.replace(/\{\{userName\}\}/g, userName || 'Unknown User');

    return result;
  }

  // Unknown formula - return as-is
  console.warn(`Unknown computed formula: ${formula}`);
  return formula;
}

/**
 * Hook wrapper for backward compatibility with tests
 * @deprecated Use evaluateComputedField directly
 */
export function useComputedFields(
  field: FormField,
  formValues: Record<string, any>,
  userName?: string
): any {
  return evaluateComputedField(field, formValues, userName);
}

/**
 * Extract field IDs from formula
 * Example: "SUM(field1, field2, field3)" => ["field1", "field2", "field3"]
 */
function extractFieldIds(formula: string): string[] {
  const match = formula.match(/\(([^)]+)\)/);
  if (!match) return [];

  return match[1].split(',').map((id) => id.trim());
}

/**
 * Format current date as YYYY-MM-DD
 */
function formatCurrentDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format current time as HH:MM
 */
function formatCurrentTime(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

