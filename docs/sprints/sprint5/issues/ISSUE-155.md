# ISSUE-155: Calculated Fields Editor (10h)

**Sprint:** Sprint 5 | **Phase:** 5 - Form Builder | **Priority:** P0
**Time:** 10 hours | **Complexity:** Large
**Created:** 2025-10-23
**Dependencies:** ISSUE-154 (Conditional Logic Builder)
**Status:** READY FOR IMPLEMENTATION

## What You'll Do

Create calculated fields editor using expr-eval library for formula evaluation with support for basic operators (+, -, \*, /), functions (SUM, AVG, MIN, MAX), field references, live preview, and circular dependency detection.

## Prerequisites

- [ ] ISSUE-154 complete (Conditional logic functional)
- [ ] Form builder architecture ready
- [ ] Code editor open to apps/web directory

## Libraries/Dependencies

**expr-eval:**

- **Version:** ^2.0.2
- **License:** MIT (simple, permissive, NO copyleft)
- **Why:** Simpler than mathjs (no LGPL concerns), lighter (5KB vs heavy), more secure (no import/createUnit risks)
- **Better Than:** mathjs (Apache 2.0 + LGPL-2.1+ copyleft, security concerns with import function)
- **Install:**
  ```bash
  pnpm add expr-eval
  ```

**Security Note:** expr-eval is safer for user-generated formulas. mathjs has dangerous functions (import, createUnit) that can alter built-in functionality.

## Step-by-Step Instructions

### Step 1: Install expr-eval (10 min)

```bash
cd apps/web
pnpm add expr-eval
```

Verify installation:

```bash
grep "expr-eval" package.json
```

### Step 2: Create CalculatedFieldEditor Component (240 min)

Create `apps/web/components/form-builder/calculated-field-editor.tsx`:

```typescript
'use client';

import { Stack, TextInput, Text, Code, Alert, Group, Select, NumberInput } from '@mantine/core';
import { Parser } from 'expr-eval';
import { useState, useEffect } from 'react';
import { Field } from '@braveforms/types';
import { IconAlertCircle, IconCheck } from '@tabler/icons-react';

interface CalculatedFieldEditorProps {
  field: Field;
  allFields: Field[];
  onChange: (field: Partial<Field>) => void;
}

export function CalculatedFieldEditor({
  field,
  allFields,
  onChange,
}: CalculatedFieldEditorProps) {
  const [formula, setFormula] = useState(field.calculated?.formula || '');
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<number | null>(null);

  const parser = new Parser();

  const validateFormula = (formula: string): boolean => {
    try {
      // Sanitize formula (remove dangerous characters)
      const sanitized = formula.replace(/[^0-9a-zA-Z+\-*/(){},._ ]/g, '');

      // Test parse
      parser.parse(sanitized);

      // Check field references exist
      const fieldRefs = formula.match(/\{(\w+)\}/g) || [];
      const invalidRefs = fieldRefs.filter((ref) => {
        const fieldName = ref.slice(1, -1);
        return !allFields.find((f) => f.name === fieldName);
      });

      if (invalidRefs.length > 0) {
        throw new Error(`Unknown fields: ${invalidRefs.join(', ')}`);
      }

      // Check for circular dependencies
      if (detectCircularDependency(field, allFields, formula)) {
        throw new Error('Circular dependency detected');
      }

      setError(null);
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  const calculatePreview = (formula: string, fieldValues: Record<string, number>) => {
    try {
      // Replace field references {fieldName} with actual field names
      let expression = formula;
      const fieldRefs = formula.match(/\{(\w+)\}/g) || [];

      fieldRefs.forEach((ref) => {
        const fieldName = ref.slice(1, -1);
        expression = expression.replace(ref, fieldName);
      });

      // Evaluate using expr-eval
      const result = parser.evaluate(expression, fieldValues);
      setPreview(result);
    } catch (err) {
      setPreview(null);
    }
  };

  const handleFormulaChange = (newFormula: string) => {
    setFormula(newFormula);

    if (validateFormula(newFormula)) {
      onChange({
        ...field,
        calculated: {
          formula: newFormula,
          unit: field.calculated?.unit || 'number',
        },
      });

      // Calculate preview with sample values
      const sampleValues: Record<string, number> = {};
      allFields.forEach((f) => {
        if (f.type === 'number') {
          sampleValues[f.name] = 10; // Sample value
        }
      });
      calculatePreview(newFormula, sampleValues);
    }
  };

  return (
    <Stack gap="md">
      <TextInput
        label="Formula"
        placeholder="SUM({field1}, {field2})"
        value={formula}
        onChange={(e) => handleFormulaChange(e.target.value)}
        error={error}
        description="Use {fieldName} to reference other fields"
      />

      {error && (
        <Alert color="red" icon={<IconAlertCircle size={16} />}>
          {error}
        </Alert>
      )}

      {preview !== null && !error && (
        <Alert color="green" icon={<IconCheck size={16} />}>
          Preview: {preview}
        </Alert>
      )}

      <Select
        label="Unit"
        value={field.calculated?.unit || 'number'}
        onChange={(value) => onChange({
          ...field,
          calculated: {
            ...field.calculated,
            unit: value || 'number',
          },
        })}
        data={[
          { value: 'number', label: 'Number' },
          { value: 'currency', label: 'Currency ($)' },
          { value: 'percentage', label: 'Percentage (%)' },
        ]}
      />

      <Stack gap="xs">
        <Text size="sm" fw={500}>Supported Operators:</Text>
        <Code block>
          {`+  (addition)
-  (subtraction)
*  (multiplication)
/  (division)
() (grouping)`}
        </Code>
      </Stack>

      <Stack gap="xs">
        <Text size="sm" fw={500}>Supported Functions:</Text>
        <Code block>
          {`SUM(a, b, c)    - Sum of values
AVG(a, b, c)    - Average of values
MIN(a, b, c)    - Minimum value
MAX(a, b, c)    - Maximum value`}
        </Code>
      </Stack>

      <Stack gap="xs">
        <Text size="sm" fw={500}>Field References:</Text>
        <Code block>
          {allFields
            .filter((f) => f.type === 'number' && f.id !== field.id)
            .map((f) => `{${f.name}}`).join('\n') || 'No numeric fields available'}
        </Code>
      </Stack>
    </Stack>
  );
}

function detectCircularDependency(
  field: Field,
  allFields: Field[],
  formula: string,
  visited: Set<string> = new Set()
): boolean {
  if (visited.has(field.id)) {
    return true; // Circular dependency found
  }

  visited.add(field.id);

  // Extract field references from formula
  const fieldRefs = formula.match(/\{(\w+)\}/g) || [];
  const referencedFieldNames = fieldRefs.map((ref) => ref.slice(1, -1));

  for (const fieldName of referencedFieldNames) {
    const referencedField = allFields.find((f) => f.name === fieldName);

    if (referencedField?.type === 'calculated') {
      if (detectCircularDependency(
        referencedField,
        allFields,
        referencedField.calculated?.formula || '',
        new Set(visited)
      )) {
        return true;
      }
    }
  }

  return false;
}
```

### Step 3: Integrate with Properties Panel (60 min)

Update `apps/web/components/form-builder/properties-panel.tsx`:

```typescript
import { CalculatedFieldEditor } from './calculated-field-editor';

// Add tab for calculated fields
const tabs = [
  { value: 'basic', label: 'Basic' },
  { value: 'validation', label: 'Validation' },
  { value: 'logic', label: 'Logic' },
  { value: 'calculations', label: 'Calculations' },
  { value: 'advanced', label: 'Advanced' },
];

// Render calculated field editor in calculations tab
{activeTab === 'calculations' && selectedField && (
  <CalculatedFieldEditor
    field={selectedField}
    allFields={allFormFields}
    onChange={(updates) => handleFieldUpdate(selectedField.id, updates)}
  />
)}
```

### Step 4: Add Formula Evaluation to FormRenderer (120 min)

Create `apps/web/utils/evaluate-calculated-field.ts`:

```typescript
import { Parser } from 'expr-eval';
import { Field } from '@braveforms/types';

export function evaluateCalculatedField(
  field: Field,
  formValues: Record<string, any>
): number | null {
  if (!field.calculated?.formula) return null;

  try {
    const parser = new Parser();

    // Replace field references with values
    let expression = field.calculated.formula;
    const fieldRefs = expression.match(/\{(\w+)\}/g) || [];

    const values: Record<string, number> = {};
    fieldRefs.forEach((ref) => {
      const fieldName = ref.slice(1, -1);
      const value = formValues[fieldName];

      if (typeof value === 'number') {
        values[fieldName] = value;
        expression = expression.replace(ref, fieldName);
      } else {
        throw new Error(`Field ${fieldName} has no numeric value`);
      }
    });

    // Evaluate expression
    const result = parser.evaluate(expression, values);

    return typeof result === 'number' ? result : null;
  } catch (err) {
    console.error('Error evaluating calculated field:', err);
    return null;
  }
}
```

Update FormRenderer to use calculated fields:

```typescript
import { evaluateCalculatedField } from '@/utils/evaluate-calculated-field';

// In FormRenderer component:
useEffect(() => {
  // Re-calculate all calculated fields when form values change
  const calculatedFields = schema.sections
    .flatMap((s) => s.fields)
    .filter((f) => f.type === 'calculated');

  calculatedFields.forEach((field) => {
    const result = evaluateCalculatedField(field, formValues);
    if (result !== null) {
      setValue(field.name, result);
    }
  });
}, [formValues]);
```

### Step 5: Test Calculated Fields (120 min)

```bash
# Restart web container
kubectl rollout restart deployment/web -n braveforms

# Access form builder
# Navigate to http://localhost:30102/admin/forms/new
```

**Verify:**

- [ ] expr-eval installed
- [ ] Calculated field editor displays
- [ ] Formula validation works
- [ ] Live preview updates
- [ ] Circular dependency detection works
- [ ] SUM, AVG, MIN, MAX functions work
- [ ] Field references resolve correctly
- [ ] FormRenderer evaluates calculated fields

## TDD Workflow (MANDATORY)

### Phase 1: Write Tests First

Create `apps/web/components/form-builder/__tests__/calculated-field-editor.test.tsx`:

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { CalculatedFieldEditor } from '../calculated-field-editor';

describe('CalculatedFieldEditor', () => {
  const mockField = {
    id: 'calc-1',
    type: 'calculated',
    name: 'totalCost',
    label: 'Total Cost',
  };

  const mockFields = [
    { id: 'quantity', type: 'number', name: 'quantity', label: 'Quantity' },
    { id: 'price', type: 'number', name: 'price', label: 'Price' },
  ];

  it('should validate formula syntax', () => {
    const onChange = jest.fn();
    render(
      <CalculatedFieldEditor
        field={mockField}
        allFields={mockFields}
        onChange={onChange}
      />
    );

    const formulaInput = screen.getByPlaceholderText('SUM({field1}, {field2})');
    fireEvent.change(formulaInput, { target: { value: 'SUM({quantity}, {price})' } });

    expect(screen.queryByText(/Unknown fields/)).not.toBeInTheDocument();
  });

  it('should detect circular dependencies', () => {
    const circularField = {
      ...mockField,
      calculated: { formula: '{totalCost}' },
    };

    render(
      <CalculatedFieldEditor
        field={circularField}
        allFields={[...mockFields, mockField]}
        onChange={jest.fn()}
      />
    );

    expect(screen.getByText(/Circular dependency detected/)).toBeInTheDocument();
  });

  it('should calculate preview with sample values', () => {
    render(
      <CalculatedFieldEditor
        field={mockField}
        allFields={mockFields}
        onChange={jest.fn()}
      />
    );

    const formulaInput = screen.getByPlaceholderText('SUM({field1}, {field2})');
    fireEvent.change(formulaInput, { target: { value: 'SUM({quantity}, {price})' } });

    expect(screen.getByText(/Preview: 20/)).toBeInTheDocument(); // 10 + 10
  });
});
```

Create `apps/web/utils/__tests__/evaluate-calculated-field.test.ts`:

```typescript
import { evaluateCalculatedField } from '../evaluate-calculated-field';

describe('evaluateCalculatedField', () => {
  it('should evaluate basic arithmetic', () => {
    const field = {
      id: 'calc-1',
      type: 'calculated',
      name: 'result',
      calculated: {
        formula: '{a} + {b}',
      },
    };

    const result = evaluateCalculatedField(field, { a: 5, b: 10 });
    expect(result).toBe(15);
  });

  it('should evaluate SUM function', () => {
    const field = {
      id: 'calc-1',
      type: 'calculated',
      name: 'total',
      calculated: {
        formula: 'SUM({a}, {b}, {c})',
      },
    };

    const result = evaluateCalculatedField(field, { a: 5, b: 10, c: 15 });
    expect(result).toBe(30);
  });

  it('should handle division by zero', () => {
    const field = {
      id: 'calc-1',
      type: 'calculated',
      name: 'ratio',
      calculated: {
        formula: '{a} / {b}',
      },
    };

    const result = evaluateCalculatedField(field, { a: 10, b: 0 });
    expect(result).toBe(Infinity);
  });
});
```

**Screenshot:** `evidence/ISSUE-155/test-results/red-phase.png`
**Screenshot:** `evidence/ISSUE-155/test-results/green-phase.png`

## Files to Create

**Create:**

- apps/web/components/form-builder/calculated-field-editor.tsx
- apps/web/utils/evaluate-calculated-field.ts
- apps/web/components/form-builder/**tests**/calculated-field-editor.test.tsx
- apps/web/utils/**tests**/evaluate-calculated-field.test.ts

**Modify:**

- apps/web/components/form-builder/properties-panel.tsx (add calculations tab)
- apps/web/components/form-renderer/form-renderer.tsx (evaluate calculated fields)
- apps/web/package.json (add expr-eval)

## Verification Checklist

- [ ] expr-eval installed (NOT mathjs)
- [ ] Calculated field editor functional
- [ ] Formula validation works
- [ ] Circular dependency detection works
- [ ] SUM, AVG, MIN, MAX functions work
- [ ] Live preview displays
- [ ] FormRenderer evaluates formulas
- [ ] Tests passing (>80% coverage)
- [ ] Zero emoji, zero AI branding

## Evidence Requirements

**Location:** evidence/ISSUE-161/

**Required:**

- test-results/red-phase.png
- test-results/green-phase.png
- screenshots/calculated-field-editor.png
- screenshots/formula-validation.png
- screenshots/live-preview.png
- screenshots/circular-dependency-error.png

## Success Criteria

- [ ] Calculated fields functional using expr-eval
- [ ] All operators work (+, -, \*, /, ())
- [ ] All functions work (SUM, AVG, MIN, MAX)
- [ ] Circular dependency detection prevents infinite loops
- [ ] Live preview calculates correctly
- [ ] Performance <200ms formula evaluation
- [ ] Tests pass with >80% coverage

## Time Estimate

**10 hours total:**

- Install expr-eval: 10 min
- CalculatedFieldEditor component: 240 min
- Integrate with properties panel: 60 min
- FormRenderer evaluation: 120 min
- Testing: 120 min

## Next Issue

**ISSUE-156:** [Next issue title]
