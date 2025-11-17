import { describe, it, expect, beforeAll } from 'vitest';
import { z } from 'zod';
import { FormTemplate } from './types';
import { generateValidationSchema } from './FormRenderer';

describe('Form Validation', () => {

  it('should validate required text field', () => {
    const template: FormTemplate = {
      id: 'test',
      title: 'Test',
      version: 1,
      fields: [
        {
          id: 'name',
          type: 'text',
          label: 'Name',
          required: true,
        },
      ],
    };

    const schema = generateValidationSchema(template);

    // Valid data
    expect(() => schema.parse({ name: 'John Doe' })).not.toThrow();

    // Invalid - empty string
    expect(() => schema.parse({ name: '' })).toThrow();
    try {
      schema.parse({ name: '' });
    } catch (error: any) {
      expect(error.errors[0].message).toContain('required');
    }
  });

  it('should validate minLength for text field', () => {
    const template: FormTemplate = {
      id: 'test',
      title: 'Test',
      version: 1,
      fields: [
        {
          id: 'name',
          type: 'text',
          label: 'Name',
          required: true,
          validation: {
            minLength: 3,
          },
        },
      ],
    };

    const schema = generateValidationSchema(template);

    // Valid
    expect(() => schema.parse({ name: 'John' })).not.toThrow();

    // Invalid - too short
    expect(() => schema.parse({ name: 'Jo' })).toThrow();
    try {
      schema.parse({ name: 'Jo' });
    } catch (error: any) {
      expect(error.errors[0].message).toContain('3 characters');
    }
  });

  it('should validate number field min/max', () => {
    const template: FormTemplate = {
      id: 'test',
      title: 'Test',
      version: 1,
      fields: [
        {
          id: 'age',
          type: 'number',
          label: 'Age',
          required: true,
          validation: {
            min: 18,
            max: 100,
          },
        },
      ],
    };

    const schema = generateValidationSchema(template);

    // Valid
    expect(() => schema.parse({ age: 25 })).not.toThrow();

    // Invalid - too low
    expect(() => schema.parse({ age: 17 })).toThrow();
    try {
      schema.parse({ age: 17 });
    } catch (error: any) {
      expect(error.errors[0].message).toContain('18');
    }

    // Invalid - too high
    expect(() => schema.parse({ age: 101 })).toThrow();
    try {
      schema.parse({ age: 101 });
    } catch (error: any) {
      expect(error.errors[0].message).toContain('100');
    }
  });

  it('should validate email pattern', () => {
    const template: FormTemplate = {
      id: 'test',
      title: 'Test',
      version: 1,
      fields: [
        {
          id: 'email',
          type: 'text',
          label: 'Email',
          required: true,
          validation: {
            pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
            customMessage: 'Invalid email',
          },
        },
      ],
    };

    const schema = generateValidationSchema(template);

    // Valid
    expect(() => schema.parse({ email: 'user@example.com' })).not.toThrow();

    // Invalid
    expect(() => schema.parse({ email: 'invalid-email' })).toThrow();
    try {
      schema.parse({ email: 'invalid-email' });
    } catch (error: any) {
      expect(error.errors[0].message).toContain('Invalid email');
    }
  });

  it('should validate required checkbox', () => {
    const template: FormTemplate = {
      id: 'test',
      title: 'Test',
      version: 1,
      fields: [
        {
          id: 'agree',
          type: 'checkbox',
          label: 'I agree',
          required: true,
        },
      ],
    };

    const schema = generateValidationSchema(template);

    // Valid
    expect(() => schema.parse({ agree: true })).not.toThrow();

    // Invalid - false
    expect(() => schema.parse({ agree: false })).toThrow();
    try {
      schema.parse({ agree: false });
    } catch (error: any) {
      expect(error.errors[0].message).toContain('checked');
    }
  });
});

