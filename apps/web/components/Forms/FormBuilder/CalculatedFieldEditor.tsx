'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Stack,
  Group,
  Textarea,
  Select,
  NumberInput,
  Card,
  Text,
  Code,
  Alert,
  Button,
  ActionIcon,
  Collapse,
  Table,
} from '@mantine/core';
import { IconCalculator, IconAlertTriangle, IconCheck } from '@tabler/icons-react';
import { Parser } from 'expr-eval';
import { useSnapshot } from 'valtio';
import { formBuilderStore, updateField } from '@/lib/stores/form-builder-store';
import type { FieldDefinition } from '@brave-forms/types';

/**
 * Calculation unit types
 */
export type CalculationUnit = 'number' | 'currency' | 'percentage' | 'decimal' | 'integer';

/**
 * Whitelist of allowed functions for formula evaluation
 * Only these functions are permitted for security reasons
 */
export const ALLOWED_FUNCTIONS = [
  'SUM',
  'AVG',
  'MIN',
  'MAX',
  'COUNT',
  'ROUND',
  'ABS',
  'IF',
] as const;

/**
 * Parser with custom functions
 */
function createParser(): typeof Parser.prototype {
  const parser = new Parser();

  // Add custom functions
  parser.functions.SUM = (...args: number[]) => args.reduce((sum, val) => sum + (val || 0), 0);
  parser.functions.AVG = (...args: number[]) => {
    const validArgs = args.filter((v) => typeof v === 'number' && !isNaN(v));
    return validArgs.length > 0
      ? validArgs.reduce((sum, val) => sum + val, 0) / validArgs.length
      : 0;
  };
  parser.functions.MIN = (...args: number[]) =>
    Math.min(...args.filter((v) => typeof v === 'number'));
  parser.functions.MAX = (...args: number[]) =>
    Math.max(...args.filter((v) => typeof v === 'number'));
  parser.functions.COUNT = (...args: unknown[]) =>
    args.filter((v) => v !== null && v !== undefined).length;
  parser.functions.ROUND = (value: number, decimals = 0) => {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
  };
  parser.functions.ABS = Math.abs;
  parser.functions.IF = (condition: boolean, trueVal: number, falseVal: number) =>
    condition ? trueVal : falseVal;

  return parser;
}

// ============================================================================
// Main Component
// ============================================================================

interface CalculatedFieldEditorProps {
  fieldId: string;
}

/**
 * Calculated Field Editor Component
 *
 * Allows form creators to define formulas that compute values based on other fields.
 * Uses expr-eval for safe formula evaluation.
 */
export function CalculatedFieldEditor({ fieldId }: CalculatedFieldEditorProps) {
  const snap = useSnapshot(formBuilderStore);
  const field = snap.fields.find((f) => f.id === fieldId) as FieldDefinition | undefined;

  // Local state
  const [formula, setFormula] = useState('');
  const [unit, setUnit] = useState<CalculationUnit>('number');
  const [decimalPlaces, setDecimalPlaces] = useState(2);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(true);
  const [testValues, setTestValues] = useState<Record<string, number>>({});

  // Parser instance
  const parser = useMemo(() => createParser(), []);

  // Get numeric fields available for reference
  const numericFields = useMemo(() => {
    return (snap.fields as FieldDefinition[]).filter(
      (f) => f.id !== fieldId && (f.type === 'number' || f.type === 'measurement')
    );
  }, [snap.fields, fieldId]);

  // Load formula from field metadata on mount
  useEffect(() => {
    if (field?.metadata?.calculation) {
      setFormula(field.metadata.calculation);
    }
  }, [field?.metadata?.calculation]);

  // Initialize test values for numeric fields
  useEffect(() => {
    const initialValues: Record<string, number> = {};
    numericFields.forEach((f) => {
      initialValues[f.name] = 10; // Default test value
    });
    setTestValues(initialValues);
  }, [numericFields]);

  /**
   * Validate and parse formula
   */
  const validateFormula = useCallback(
    (formulaStr: string): { valid: boolean; error?: string } => {
      if (!formulaStr.trim()) {
        return { valid: true }; // Empty formula is valid (no calculation)
      }

      try {
        // Extract field references
        const fieldRefs = formulaStr.match(/\{([^}]+)\}/g) || [];
        const fieldNames = fieldRefs.map((ref) => ref.slice(1, -1));

        // Check all referenced fields exist
        const invalidRefs = fieldNames.filter(
          (name) => !numericFields.find((f) => f.name === name || f.id === name)
        );

        if (invalidRefs.length > 0) {
          return { valid: false, error: `Unknown fields: ${invalidRefs.join(', ')}` };
        }

        // Convert field references to variable names for parsing
        let expression = formulaStr;
        fieldRefs.forEach((ref) => {
          const fieldName = ref.slice(1, -1);
          expression = expression.replace(ref, fieldName.replace(/[^a-zA-Z0-9_]/g, '_'));
        });

        // Try to parse the expression
        parser.parse(expression);

        // Validate only whitelisted functions are used
        const functionCallPattern = /([A-Z_][A-Z0-9_]*)\s*\(/gi;
        const usedFunctions = [...expression.matchAll(functionCallPattern)].map((m) =>
          m[1].toUpperCase()
        );
        const disallowedFunctions = usedFunctions.filter(
          (fn) => !ALLOWED_FUNCTIONS.includes(fn as (typeof ALLOWED_FUNCTIONS)[number])
        );
        if (disallowedFunctions.length > 0) {
          return {
            valid: false,
            error: `Disallowed functions: ${disallowedFunctions.join(', ')}. Only ${ALLOWED_FUNCTIONS.join(', ')} are permitted.`,
          };
        }

        // Check for circular dependencies
        const circularError = detectCircularDependency(
          fieldId,
          snap.fields as FieldDefinition[],
          formulaStr
        );
        if (circularError) {
          return { valid: false, error: circularError };
        }

        return { valid: true };
      } catch (err) {
        return { valid: false, error: (err as Error).message };
      }
    },
    [parser, numericFields, snap.fields, fieldId]
  );

  /**
   * Evaluate formula with test values
   */
  const evaluatePreview = useCallback(
    (formulaStr: string, values: Record<string, number>): number | null => {
      if (!formulaStr.trim()) return null;

      try {
        // Convert field references to values
        let expression = formulaStr;
        const fieldRefs = formulaStr.match(/\{([^}]+)\}/g) || [];

        const evalValues: Record<string, number> = {};
        fieldRefs.forEach((ref) => {
          const fieldName = ref.slice(1, -1);
          const field = numericFields.find((f) => f.name === fieldName || f.id === fieldName);
          if (field) {
            const varName = fieldName.replace(/[^a-zA-Z0-9_]/g, '_');
            evalValues[varName] = values[field.name] || values[field.id] || 0;
            expression = expression.replace(ref, varName);
          }
        });

        const result = parser.evaluate(expression, evalValues);
        return typeof result === 'number' ? result : null;
      } catch {
        return null;
      }
    },
    [parser, numericFields]
  );

  // Validate and update preview when formula changes
  useEffect(() => {
    const result = validateFormula(formula);
    if (result.valid) {
      setError(null);
      const previewResult = evaluatePreview(formula, testValues);
      setPreview(previewResult);
    } else {
      setError(result.error || 'Invalid formula');
      setPreview(null);
    }
  }, [formula, testValues, validateFormula, evaluatePreview]);

  if (!field) return null;

  /**
   * Handle formula change
   */
  const handleFormulaChange = (newFormula: string) => {
    setFormula(newFormula);

    const result = validateFormula(newFormula);
    if (result.valid) {
      // Update field metadata with calculation
      updateField(fieldId, {
        metadata: {
          ...field.metadata,
          calculation: newFormula,
        },
      });
    }
  };

  /**
   * Insert field reference into formula
   */
  const insertFieldReference = (fieldName: string) => {
    const newFormula = `${formula}{${fieldName}}`;
    handleFormulaChange(newFormula);
  };

  /**
   * Insert function into formula
   */
  const insertFunction = (funcName: string) => {
    const newFormula = `${formula}${funcName}()`;
    handleFormulaChange(newFormula);
  };

  /**
   * Format preview value
   */
  const formatPreview = (value: number | null): string => {
    if (value === null) return '-';

    const formatted = value.toFixed(decimalPlaces);

    switch (unit) {
      case 'currency':
        return `$${formatted}`;
      case 'percentage':
        return `${formatted}%`;
      case 'integer':
        return Math.round(value).toString();
      default:
        return formatted;
    }
  };

  return (
    <Card withBorder padding="md">
      <Stack gap="md">
        {/* Header */}
        <Group justify="space-between">
          <Group gap="xs">
            <IconCalculator size={18} />
            <div>
              <Text size="sm" fw={600}>
                Calculated Field
              </Text>
              <Text size="xs" c="dimmed">
                Auto-compute values from other fields
              </Text>
            </div>
          </Group>

          <ActionIcon variant="subtle" onClick={() => setExpanded(!expanded)}>
            {expanded ? '-' : '+'}
          </ActionIcon>
        </Group>

        <Collapse in={expanded}>
          <Stack gap="md">
            {/* Formula Input */}
            <Textarea
              label="Formula"
              placeholder="e.g., {quantity} * {unitPrice} or SUM({field1}, {field2})"
              description="Use {fieldName} to reference other fields"
              value={formula}
              onChange={(e) => handleFormulaChange(e.target.value)}
              error={error}
              minRows={2}
              autosize
            />

            {/* Error Display */}
            {error && (
              <Alert icon={<IconAlertTriangle size={16} />} color="red" title="Formula Error">
                {error}
              </Alert>
            )}

            {/* Preview Display */}
            {preview !== null && !error && (
              <Alert icon={<IconCheck size={16} />} color="green" title="Preview Result">
                <Text fw={500} size="lg">
                  {formatPreview(preview)}
                </Text>
              </Alert>
            )}

            {/* Unit and Formatting */}
            <Group grow>
              <Select
                label="Unit"
                value={unit}
                onChange={(value) => setUnit((value as CalculationUnit) || 'number')}
                data={[
                  { value: 'number', label: 'Number' },
                  { value: 'currency', label: 'Currency ($)' },
                  { value: 'percentage', label: 'Percentage (%)' },
                  { value: 'decimal', label: 'Decimal' },
                  { value: 'integer', label: 'Integer' },
                ]}
              />

              <NumberInput
                label="Decimal Places"
                value={decimalPlaces}
                onChange={(value) => setDecimalPlaces(typeof value === 'number' ? value : 2)}
                min={0}
                max={10}
              />
            </Group>

            {/* Available Fields */}
            {numericFields.length > 0 && (
              <Card withBorder padding="sm">
                <Stack gap="xs">
                  <Text size="sm" fw={500}>
                    Available Fields
                  </Text>
                  <Group gap="xs">
                    {numericFields.map((f) => (
                      <Button
                        key={f.id}
                        size="xs"
                        variant="light"
                        onClick={() => insertFieldReference(f.name)}
                      >
                        {`{${f.name}}`}
                      </Button>
                    ))}
                  </Group>
                </Stack>
              </Card>
            )}

            {/* Functions Reference */}
            <Card withBorder padding="sm">
              <Stack gap="xs">
                <Text size="sm" fw={500}>
                  Available Functions
                </Text>
                <Group gap="xs">
                  {ALLOWED_FUNCTIONS.map((func) => (
                    <Button
                      key={func}
                      size="xs"
                      variant="outline"
                      onClick={() => insertFunction(func)}
                    >
                      {func}
                    </Button>
                  ))}
                </Group>
                <Text size="xs" c="dimmed">
                  SUM(a,b,c) AVG(a,b,c) MIN(a,b,c) MAX(a,b,c) COUNT(a,b,c) ROUND(x,decimals) ABS(x)
                  IF(condition, trueVal, falseVal)
                </Text>
              </Stack>
            </Card>

            {/* Test Values */}
            {numericFields.length > 0 && (
              <Card withBorder padding="sm">
                <Stack gap="xs">
                  <Text size="sm" fw={500}>
                    Test Values
                  </Text>
                  <Text size="xs" c="dimmed">
                    Adjust test values to preview calculation results
                  </Text>
                  <Table>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Field</Table.Th>
                        <Table.Th>Test Value</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {numericFields.slice(0, 5).map((f) => (
                        <Table.Tr key={f.id}>
                          <Table.Td>{f.label || f.name}</Table.Td>
                          <Table.Td>
                            <NumberInput
                              size="xs"
                              value={testValues[f.name] || 0}
                              onChange={(value) =>
                                setTestValues((prev) => ({
                                  ...prev,
                                  [f.name]: typeof value === 'number' ? value : 0,
                                }))
                              }
                              style={{ width: 100 }}
                            />
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </Stack>
              </Card>
            )}

            {/* Operators Reference */}
            <Card withBorder padding="sm">
              <Stack gap="xs">
                <Text size="sm" fw={500}>
                  Operators
                </Text>
                <Code block>
                  {`+  Addition       e.g., {a} + {b}
-  Subtraction    e.g., {a} - {b}
*  Multiplication e.g., {a} * {b}
/  Division       e.g., {a} / {b}
() Grouping       e.g., ({a} + {b}) * {c}
>  Greater than   e.g., IF({a} > 10, 1, 0)
<  Less than      e.g., IF({a} < 5, 0, 1)
== Equal          e.g., IF({a} == {b}, 1, 0)`}
                </Code>
              </Stack>
            </Card>
          </Stack>
        </Collapse>
      </Stack>
    </Card>
  );
}

// ============================================================================
// Circular Dependency Detection
// ============================================================================

/**
 * Detect circular dependencies in calculated fields
 */
function detectCircularDependency(
  currentFieldId: string,
  allFields: FieldDefinition[],
  formula: string,
  visited: Set<string> = new Set()
): string | null {
  if (visited.has(currentFieldId)) {
    return 'Circular dependency detected - this formula references itself through other fields';
  }

  visited.add(currentFieldId);

  // Extract field references from formula
  const fieldRefs = formula.match(/\{([^}]+)\}/g) || [];
  const fieldNames = fieldRefs.map((ref) => ref.slice(1, -1));

  for (const fieldName of fieldNames) {
    const referencedField = allFields.find((f) => f.name === fieldName || f.id === fieldName);

    if (referencedField?.metadata?.calculation) {
      const error = detectCircularDependency(
        referencedField.id,
        allFields,
        referencedField.metadata.calculation,
        new Set(visited)
      );

      if (error) {
        return error;
      }
    }
  }

  return null;
}

// ============================================================================
// Evaluation Helper Functions
// ============================================================================

/**
 * Evaluate a calculated field value given form data
 */
export function evaluateCalculatedField(
  field: FieldDefinition,
  formValues: Record<string, unknown>,
  allFields: FieldDefinition[]
): number | null {
  const formula = field.metadata?.calculation;
  if (!formula) return null;

  try {
    const parser = createParser();

    // Convert field references to values
    let expression = formula;
    const fieldRefs = formula.match(/\{([^}]+)\}/g) || [];

    const evalValues: Record<string, number> = {};
    fieldRefs.forEach((ref) => {
      const fieldName = ref.slice(1, -1);
      const refField = allFields.find((f) => f.name === fieldName || f.id === fieldName);

      if (refField) {
        const value = formValues[refField.name] ?? formValues[refField.id];
        const numValue = typeof value === 'number' ? value : parseFloat(String(value));

        if (!isNaN(numValue)) {
          const varName = fieldName.replace(/[^a-zA-Z0-9_]/g, '_');
          evalValues[varName] = numValue;
          expression = expression.replace(ref, varName);
        }
      }
    });

    const result = parser.evaluate(expression, evalValues);
    return typeof result === 'number' && isFinite(result) ? result : null;
  } catch {
    return null;
  }
}

/**
 * Evaluate all calculated fields in a form
 */
export function evaluateAllCalculatedFields(
  fields: FieldDefinition[],
  formValues: Record<string, unknown>
): Record<string, number> {
  const calculatedValues: Record<string, number> = {};

  // Find all calculated fields (fields with calculation in metadata)
  const calculatedFields = fields.filter((f) => f.metadata?.calculation);

  // Sort by dependencies (simple topological sort)
  const sorted = topologicalSort(calculatedFields, fields);

  // Evaluate in dependency order
  const currentValues = { ...formValues };
  sorted.forEach((field) => {
    const result = evaluateCalculatedField(field, currentValues, fields);
    if (result !== null) {
      calculatedValues[field.id] = result;
      calculatedValues[field.name] = result;
      currentValues[field.id] = result;
      currentValues[field.name] = result;
    }
  });

  return calculatedValues;
}

/**
 * Topological sort for calculated fields based on dependencies
 */
function topologicalSort(
  calculatedFields: FieldDefinition[],
  _allFields: FieldDefinition[]
): FieldDefinition[] {
  const result: FieldDefinition[] = [];
  const visited = new Set<string>();

  const visit = (field: FieldDefinition) => {
    if (visited.has(field.id)) return;
    visited.add(field.id);

    // Get dependencies
    const formula = field.metadata?.calculation || '';
    const fieldRefs = formula.match(/\{([^}]+)\}/g) || [];
    const depNames = fieldRefs.map((ref) => ref.slice(1, -1));

    // Visit dependencies first
    depNames.forEach((name) => {
      const depField = calculatedFields.find((f) => f.name === name || f.id === name);
      if (depField) {
        visit(depField);
      }
    });

    result.push(field);
  };

  calculatedFields.forEach(visit);
  return result;
}

export default CalculatedFieldEditor;
