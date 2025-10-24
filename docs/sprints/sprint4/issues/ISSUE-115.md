# ISSUE-115: Validate All Templates

**Sprint:** Sprint 4 | **Phase:** 2 - Q&D Agency Templates | **Priority:** P0
**Time:** 1 hour | **Complexity:** Small
**Created:** 2025-10-23
**Dependencies:** ISSUE-114 (All 9 new templates created)
**Status:** NOT STARTED

## What You'll Do

Run validation script on all 20 templates (11 existing from Sprint 3 + 9 new from Sprint 4 Phase 2) to ensure they pass Zod schema validation, have no duplicate field IDs, and have correct conditional logic references.

## Prerequisites

- [ ] ISSUE-114 complete (All 9 new templates created)
- [ ] All templates exist in packages/database/templates/
- [ ] Validation script exists: packages/database/scripts/validate-templates.ts

## Step-by-Step Instructions

### Step 1: Review Validation Script (10 min)

Check that validation script exists and covers all requirements:

```bash
cd packages/database
cat scripts/validate-templates.ts
```

Expected validation checks:

1. **JSON syntax** - Valid JSON structure
2. **Zod schema** - Passes FormTemplate schema validation
3. **Duplicate field IDs** - No duplicate IDs within template
4. **Conditional logic** - Field references exist
5. **Repeater itemSchema** - Valid nested structure
6. **Required fields** - All compliance.requiredFields exist in schema

If script doesn't exist, create it:

```typescript
// packages/database/scripts/validate-templates.ts
import * as fs from 'fs';
import * as path from 'path';
import { z } from 'zod';

// Import Zod schema from types package
import { FormTemplateSchema } from '@braveforms/types';

const TEMPLATES_DIR = path.join(__dirname, '../templates');

interface ValidationResult {
  templateName: string;
  valid: boolean;
  errors: string[];
}

function validateTemplate(filePath: string): ValidationResult {
  const templateName = path.basename(filePath);
  const errors: string[] = [];

  try {
    // 1. Read and parse JSON
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    let template: any;

    try {
      template = JSON.parse(fileContent);
    } catch (err) {
      return {
        templateName,
        valid: false,
        errors: [`Invalid JSON syntax: ${err.message}`],
      };
    }

    // 2. Validate against Zod schema
    try {
      FormTemplateSchema.parse(template);
    } catch (err) {
      if (err instanceof z.ZodError) {
        errors.push(`Schema validation failed: ${err.errors.map((e) => e.message).join(', ')}`);
      }
    }

    // 3. Check for duplicate field IDs
    const allFieldIds = new Set<string>();
    for (const section of template.schema?.sections || []) {
      for (const field of section.fields || []) {
        if (allFieldIds.has(field.id)) {
          errors.push(`Duplicate field ID: ${field.id}`);
        }
        allFieldIds.add(field.id);

        // Check repeater itemSchema fields
        if (field.type === 'repeater' && field.itemSchema?.fields) {
          for (const itemField of field.itemSchema.fields) {
            const itemFieldId = `${field.id}.${itemField.id}`;
            if (allFieldIds.has(itemFieldId)) {
              errors.push(`Duplicate field ID in repeater: ${itemFieldId}`);
            }
            allFieldIds.add(itemFieldId);
          }
        }
      }
    }

    // 4. Validate conditional logic references
    for (const section of template.schema?.sections || []) {
      for (const field of section.fields || []) {
        if (field.conditionalLogic?.field) {
          if (!allFieldIds.has(field.conditionalLogic.field)) {
            errors.push(
              `Conditional logic references non-existent field: ${field.conditionalLogic.field} (in field ${field.id})`
            );
          }
        }

        // Check repeater itemSchema conditional logic
        if (field.type === 'repeater' && field.itemSchema?.fields) {
          for (const itemField of field.itemSchema.fields) {
            if (itemField.conditionalLogic?.field) {
              const refFieldId = `${field.id}.${itemField.conditionalLogic.field}`;
              if (!allFieldIds.has(refFieldId)) {
                errors.push(
                  `Conditional logic in repeater references non-existent field: ${itemField.conditionalLogic.field}`
                );
              }
            }
          }
        }
      }
    }

    // 5. Verify required fields exist
    const requiredFields = template.compliance?.requiredFields || [];
    for (const reqField of requiredFields) {
      if (!allFieldIds.has(reqField)) {
        errors.push(`Required field not found in schema: ${reqField}`);
      }
    }

    return {
      templateName,
      valid: errors.length === 0,
      errors,
    };
  } catch (err) {
    return {
      templateName,
      valid: false,
      errors: [`Unexpected error: ${err.message}`],
    };
  }
}

function main() {
  console.log('Validating all form templates...\n');

  const files = fs.readdirSync(TEMPLATES_DIR).filter((f) => f.endsWith('.json'));

  const results: ValidationResult[] = files.map((file) => {
    const filePath = path.join(TEMPLATES_DIR, file);
    return validateTemplate(filePath);
  });

  let allValid = true;

  for (const result of results) {
    if (result.valid) {
      console.log(`✓ ${result.templateName} - Valid`);
    } else {
      console.log(`✗ ${result.templateName} - Invalid`);
      result.errors.forEach((err) => console.log(`  - ${err}`));
      allValid = false;
    }
  }

  console.log(`\nValidation Summary: ${results.length} templates`);
  const validCount = results.filter((r) => r.valid).length;
  console.log(`✓ Valid: ${validCount}`);
  console.log(`✗ Invalid: ${results.length - validCount}`);

  if (allValid) {
    console.log('\n✓ All templates validated successfully!');
    process.exit(0);
  } else {
    console.log('\n✗ Some templates failed validation. Fix errors above.');
    process.exit(1);
  }
}

main();
```

Add script to package.json:

```json
{
  "scripts": {
    "validate:templates": "ts-node scripts/validate-templates.ts"
  }
}
```

### Step 2: Run Validation on All 20 Templates (20 min)

Execute validation script:

```bash
cd packages/database
pnpm validate:templates
```

Expected output:

```
Validating all form templates...

✓ 01-general-daily-log.json - Valid
✓ 02-superintendent-daily-report.json - Valid
✓ 03-safety-inspection.json - Valid
✓ 04-toolbox-talk.json - Valid
✓ 05-incident-report.json - Valid
✓ 06-quality-control-inspection.json - Valid
✓ 07-material-receiving-log.json - Valid
✓ 08-equipment-inspection.json - Valid
✓ 09-environmental-inspection.json - Valid
✓ 10-weekly-stormwater-inspection.json - Valid
✓ 11-swppp-inspection.json - Valid
✓ 12-ndep-bwpc-swppp.json - Valid
✓ 13-ndot-swppp.json - Valid
✓ 14-ndep-weekly-stormwater.json - Valid
✓ 15-ndot-weekly-stormwater.json - Valid
✓ 16-tmwa-inspection.json - Valid
✓ 17-quarterly-visual-assessment.json - Valid
✓ 18-visual-assessment-report.json - Valid
✓ 19-routine-facility-inspection.json - Valid
✓ 20-wiw-daily-form.json - Valid

Validation Summary: 20 templates
✓ Valid: 20
✗ Invalid: 0

✓ All templates validated successfully!
```

**If any template fails validation:**

1. Read error message carefully
2. Open failing template JSON
3. Fix the specific error (duplicate ID, missing field reference, etc.)
4. Re-run validation
5. Repeat until all pass

Screenshot: Save to evidence/ISSUE-115/test-results/validation-success.png

### Step 3: Verify Template Count and Coverage (10 min)

Verify all 20 templates present:

```bash
cd packages/database/templates
ls -la *.json | wc -l
# Should output: 20
```

**Q&D Construction Template Coverage:**

- Templates 01-11: Existing from Sprint 3 (6/15 = 40%)
- Templates 12-20: New from Sprint 4 (9/15 = 60%)
- **Total: 20 templates created**
- **Q&D Coverage: 15/15 templates (100%)**
  - 11 general construction templates
  - 4 additional templates (not Q&D-specific but useful)

Note: We have 20 templates total, but Q&D Construction uses 15 of them (100% of their requirements met).

### Step 4: Run Unit Tests for Template Validation (20 min)

Run all template unit tests:

```bash
cd packages/database
pnpm test templates
```

Expected: All template tests pass (20+ test suites).

Screenshot: Save to evidence/ISSUE-115/test-results/unit-tests-passing.png

## TDD Workflow (MANDATORY)

Tests already exist from ISSUE-106 through ISSUE-114. This issue validates they all pass together.

## Files Modified

**If validation script doesn't exist:**

- packages/database/scripts/validate-templates.ts (created)
- packages/database/package.json (add validate:templates script)

**No new files if script exists** - just run validation.

## Verification Checklist

- [ ] Validation script exists
- [ ] All 20 templates pass validation
- [ ] No duplicate field IDs in any template
- [ ] All conditional logic references valid fields
- [ ] All repeater itemSchema structures correct
- [ ] All required fields exist in schemas
- [ ] Unit tests passing for all 20 templates
- [ ] Q&D Construction coverage: 15/15 (100%)
- [ ] Zero emoji, zero AI branding

## Evidence Requirements

**Location:** evidence/ISSUE-115/

**Required:**

- test-results/
  - validation-success.png (validation script output, all 20 templates valid)
  - unit-tests-passing.png (pnpm test templates output)
- documentation/
  - template-count-verification.txt (ls output showing 20 templates)

## Troubleshooting

**Problem:** Template fails with "Duplicate field ID"

- **Cause:** Same field ID used in multiple sections
- **Solution:** Rename field to be unique (e.g., prefix with section name)

**Problem:** "Conditional logic references non-existent field"

- **Cause:** Typo in conditionalLogic.field reference
- **Solution:** Fix field reference to match exact ID (case-sensitive)

**Problem:** "Required field not found in schema"

- **Cause:** compliance.requiredFields lists field not in template
- **Solution:** Either add field to template or remove from requiredFields

**Problem:** Validation script doesn't run

- **Cause:** Missing dependencies or TypeScript compilation error
- **Solution:** Run `pnpm install` and verify ts-node available

## Success Criteria

- [ ] Validation script runs successfully
- [ ] All 20 templates pass validation
- [ ] Zero duplicate field IDs
- [ ] Zero invalid conditional logic references
- [ ] All unit tests passing
- [ ] Evidence screenshots collected
- [ ] Q&D Construction 100% template coverage confirmed

## Time Estimate

**1 hour total:**

- Review validation script: 10 min
- Run validation on 20 templates: 20 min
- Verify template count: 10 min
- Run unit tests: 20 min

## Next Issue

**ISSUE-116:** Seed All Q&D Templates (1h)

- Prerequisites: ISSUE-115 complete (all templates validated)
- Phase: 2 - Q&D Agency Templates
- Seeds all 20 templates to database and verifies via GraphQL
