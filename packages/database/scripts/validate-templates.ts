import * as fs from 'fs';
import * as path from 'path';

interface ValidationError {
  file: string;
  error: string;
  severity: 'error' | 'warning';
}

const VALID_CATEGORIES = ['DAILY_LOG', 'SAFETY', 'QUALITY_CONTROL', 'EQUIPMENT', 'LOGISTICS', 'COMPLIANCE'];

const VALID_FIELD_TYPES = [
  'text',
  'textarea',
  'number',
  'date',
  'time',
  'datetime-local',
  'select',
  'radio',
  'checkbox',
  'checkboxes',
  'repeater',
  'signature',
  'photo',
];

const errors: ValidationError[] = [];

function addError(file: string, error: string, severity: 'error' | 'warning' = 'error') {
  errors.push({ file, error, severity });
}

function validateTemplate(filePath: string): void {
  const fileName = path.basename(filePath);

  // Read file
  let content: string;
  try {
    content = fs.readFileSync(filePath, 'utf-8');
  } catch (err) {
    addError(fileName, `Failed to read file: ${(err as Error).message}`);
    return;
  }

  // Parse JSON
  let template: any;
  try {
    template = JSON.parse(content);
  } catch (err) {
    addError(fileName, `Invalid JSON: ${(err as Error).message}`);
    return;
  }

  // Validate top-level structure
  if (!template.name) {
    addError(fileName, 'Missing required field: name');
  }
  if (!template.description) {
    addError(fileName, 'Missing required field: description');
  }
  if (!template.category) {
    addError(fileName, 'Missing required field: category');
  } else if (!VALID_CATEGORIES.includes(template.category)) {
    addError(fileName, `Invalid category: ${template.category}. Must be one of: ${VALID_CATEGORIES.join(', ')}`);
  }
  if (!template.version) {
    addError(fileName, 'Missing required field: version');
  }
  if (!template.schema) {
    addError(fileName, 'Missing required field: schema');
    return; // Can't validate further without schema
  }
  if (!template.schema.sections || !Array.isArray(template.schema.sections)) {
    addError(fileName, 'schema.sections must be an array');
    return;
  }
  if (template.offlineCapable !== true) {
    addError(fileName, 'All templates must be offlineCapable: true', 'warning');
  }
  if (!template.metadata) {
    addError(fileName, 'Missing recommended field: metadata', 'warning');
  }

  // Track all field IDs to detect duplicates
  const allFieldIds = new Set<string>();
  const sectionIds = new Set<string>();

  // Validate each section
  template.schema.sections.forEach((section: any, sectionIndex: number) => {
    const sectionPath = `section[${sectionIndex}]`;

    if (!section.id) {
      addError(fileName, `${sectionPath}: Missing section.id`);
    } else {
      if (sectionIds.has(section.id)) {
        addError(fileName, `${sectionPath}: Duplicate section ID: ${section.id}`);
      }
      sectionIds.add(section.id);
    }

    if (!section.title) {
      addError(fileName, `${sectionPath}: Missing section.title`);
    }

    if (section.order === undefined) {
      addError(fileName, `${sectionPath}: Missing section.order`);
    }

    if (!section.fields || !Array.isArray(section.fields)) {
      addError(fileName, `${sectionPath}: section.fields must be an array`);
      return;
    }

    // Validate each field
    section.fields.forEach((field: any, fieldIndex: number) => {
      const fieldPath = `${sectionPath}.field[${fieldIndex}]`;

      if (!field.id) {
        addError(fileName, `${fieldPath}: Missing field.id`);
      } else {
        if (allFieldIds.has(field.id)) {
          addError(fileName, `${fieldPath}: Duplicate field ID: ${field.id}`);
        }
        allFieldIds.add(field.id);
      }

      if (!field.type) {
        addError(fileName, `${fieldPath}: Missing field.type`);
      } else if (!VALID_FIELD_TYPES.includes(field.type)) {
        addError(fileName, `${fieldPath}: Invalid field type: ${field.type}`);
      }

      if (!field.label) {
        addError(fileName, `${fieldPath}: Missing field.label`);
      }

      if (field.required === undefined) {
        addError(fileName, `${fieldPath}: Missing field.required (should be true or false)`, 'warning');
      }

      // Validate select/radio options
      if ((field.type === 'select' || field.type === 'radio' || field.type === 'checkboxes') && !field.options) {
        addError(fileName, `${fieldPath}: Field type ${field.type} requires options array`);
      }

      // Validate repeater itemSchema
      if (field.type === 'repeater' && !field.itemSchema) {
        addError(fileName, `${fieldPath}: Repeater field requires itemSchema`);
      }

      // Validate conditional display references valid fields
      if (field.conditionalDisplay) {
        const referencedField = field.conditionalDisplay.field;
        if (!allFieldIds.has(referencedField)) {
          // Check if it's defined earlier in the same section (will be added to set)
          const earlierField = section.fields.find((f: any, i: number) => i < fieldIndex && f.id === referencedField);
          if (!earlierField) {
            addError(
              fileName,
              `${fieldPath}: conditionalDisplay references unknown field: ${referencedField}`,
              'warning'
            );
          }
        }
      }

      // Validate repeater itemSchema recursively
      if (field.type === 'repeater' && field.itemSchema && field.itemSchema.fields) {
        const repeaterFieldIds = new Set<string>();
        field.itemSchema.fields.forEach((subField: any, subFieldIndex: number) => {
          const subFieldPath = `${fieldPath}.itemSchema.field[${subFieldIndex}]`;

          if (!subField.id) {
            addError(fileName, `${subFieldPath}: Missing field.id`);
          } else if (repeaterFieldIds.has(subField.id)) {
            addError(fileName, `${subFieldPath}: Duplicate field ID within repeater: ${subField.id}`);
          } else {
            repeaterFieldIds.add(subField.id);
          }

          if (!subField.type) {
            addError(fileName, `${subFieldPath}: Missing field.type`);
          } else if (!VALID_FIELD_TYPES.includes(subField.type)) {
            addError(fileName, `${subFieldPath}: Invalid field type: ${subField.type}`);
          }

          if (!subField.label) {
            addError(fileName, `${subFieldPath}: Missing field.label`);
          }
        });
      }
    });
  });

  // Validate compliance metadata if present
  if (template.compliance) {
    if (!template.compliance.regulation) {
      addError(fileName, 'compliance.regulation is recommended when compliance is present', 'warning');
    }
    if (!template.compliance.requiredFields || !Array.isArray(template.compliance.requiredFields)) {
      addError(fileName, 'compliance.requiredFields should be an array', 'warning');
    }
  }
}

function main() {
  const templatesDir = path.join(__dirname, '..', 'templates');

  if (!fs.existsSync(templatesDir)) {
    console.error(`Templates directory not found: ${templatesDir}`);
    process.exit(1);
  }

  const files = fs.readdirSync(templatesDir).filter((f) => f.endsWith('.json'));

  if (files.length === 0) {
    console.error('No template JSON files found');
    process.exit(1);
  }

  console.log(`Validating ${files.length} templates...\n`);

  files.forEach((file) => {
    const filePath = path.join(templatesDir, file);
    validateTemplate(filePath);
  });

  // Report results
  const errorCount = errors.filter((e) => e.severity === 'error').length;
  const warningCount = errors.filter((e) => e.severity === 'warning').length;

  if (errors.length === 0) {
    console.log('✅ All templates validated successfully!');
    console.log(`   ${files.length} templates checked`);
    process.exit(0);
  } else {
    console.log('❌ Validation errors found:\n');

    errors.forEach((err) => {
      const icon = err.severity === 'error' ? '❌' : '⚠️';
      console.log(`${icon} [${err.file}] ${err.error}`);
    });

    console.log(`\nSummary:`);
    console.log(`  ${errorCount} errors`);
    console.log(`  ${warningCount} warnings`);
    console.log(`  ${files.length} templates checked`);

    if (errorCount > 0) {
      process.exit(1);
    } else {
      console.log('\n⚠️  Warnings found but validation passed');
      process.exit(0);
    }
  }
}

main();
