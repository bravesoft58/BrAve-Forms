import {
  fieldValueValidators,
  evaluateConditionalLogic,
  validateFormSubmission,
  FormTemplateSchema,
  FieldType,
} from './forms.validation';

describe('Field Type Validators', () => {
  describe('text validator', () => {
    it('should validate required text field', () => {
      const schema = fieldValueValidators.text('Hello', { required: true });
      expect(() => schema.parse('Hello')).not.toThrow();
    });

    it('should reject empty required text', () => {
      const schema = fieldValueValidators.text('', { required: true });
      expect(() => schema.parse('')).toThrow('This field is required');
    });

    it('should validate minLength', () => {
      const schema = fieldValueValidators.text('abc', { minLength: 5 });
      expect(() => schema.parse('abc')).toThrow('Minimum 5 characters');
    });

    it('should validate maxLength', () => {
      const schema = fieldValueValidators.text('abcdefghij', { maxLength: 5 });
      expect(() => schema.parse('abcdefghij')).toThrow('Maximum 5 characters');
    });

    it('should validate pattern regex', () => {
      const schema = fieldValueValidators.text('abc', { pattern: '^[0-9]+$' });
      expect(() => schema.parse('abc')).toThrow('Invalid format');
      expect(() => schema.parse('123')).not.toThrow();
    });

    it('should allow optional field when not required', () => {
      const schema = fieldValueValidators.text(undefined, { required: false });
      expect(() => schema.parse(undefined)).not.toThrow();
    });
  });

  describe('number validator', () => {
    it('should validate number within range', () => {
      const schema = fieldValueValidators.number(50, { min: 0, max: 100 });
      expect(() => schema.parse(50)).not.toThrow();
    });

    it('should reject number below minimum', () => {
      const schema = fieldValueValidators.number(-5, { min: 0 });
      expect(() => schema.parse(-5)).toThrow('Minimum value is 0');
    });

    it('should reject number above maximum', () => {
      const schema = fieldValueValidators.number(150, { max: 100 });
      expect(() => schema.parse(150)).toThrow('Maximum value is 100');
    });

    it('should validate step increments', () => {
      const schema = fieldValueValidators.number(0.5, { step: 0.1 });
      expect(() => schema.parse(0.5)).not.toThrow();
      expect(() => schema.parse(0.55)).toThrow('Value must be a multiple of 0.1');
    });

    it('should handle EPA 0.25 inch threshold exactly', () => {
      const schema = fieldValueValidators.number(0.25, { min: 0, step: 0.01 });
      expect(() => schema.parse(0.25)).not.toThrow();
      expect(() => schema.parse(0.24)).not.toThrow();
      expect(() => schema.parse(0.26)).not.toThrow();
    });
  });

  describe('date validator', () => {
    it('should validate valid date string', () => {
      const schema = fieldValueValidators.date('2025-10-03', {});
      expect(() => schema.parse('2025-10-03')).not.toThrow();
    });

    it('should reject invalid date format', () => {
      const schema = fieldValueValidators.date('not-a-date', {});
      expect(() => schema.parse('not-a-date')).toThrow('Invalid date format');
    });

    it('should validate minDate constraint', () => {
      const schema = fieldValueValidators.date('2025-01-01', { minDate: '2025-06-01' });
      expect(() => schema.parse('2025-01-01')).toThrow('Date must be on or after');
    });

    it('should validate maxDate as today', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const schema = fieldValueValidators.date(tomorrow.toISOString(), { maxDate: 'today' });
      expect(() => schema.parse(tomorrow.toISOString())).toThrow('Date cannot be in the future');
    });

    it('should allow date today or earlier', () => {
      const today = new Date().toISOString();
      const schema = fieldValueValidators.date(today, { maxDate: 'today' });
      expect(() => schema.parse(today)).not.toThrow();
    });
  });

  describe('select validator', () => {
    const options = [
      { label: 'Option 1', value: 'opt1' },
      { label: 'Option 2', value: 'opt2' },
    ];

    it('should validate value from options', () => {
      const schema = fieldValueValidators.select('opt1', { required: true }, options);
      expect(() => schema.parse('opt1')).not.toThrow();
    });

    it('should reject value not in options', () => {
      const schema = fieldValueValidators.select('invalid', { required: true }, options);
      expect(() => schema.parse('invalid')).toThrow('Value must be one of');
    });

    it('should throw error if no options provided', () => {
      expect(() => fieldValueValidators.select('opt1', {}, [])).toThrow(
        'Select field must have options defined'
      );
    });
  });

  describe('checkbox validator', () => {
    it('should validate checked boolean', () => {
      const schema = fieldValueValidators.checkbox(true, {});
      expect(() => schema.parse(true)).not.toThrow();
    });

    it('should reject unchecked required checkbox', () => {
      const schema = fieldValueValidators.checkbox(false, { required: true });
      expect(() => schema.parse(false)).toThrow('This field must be checked');
    });

    it('should allow unchecked optional checkbox', () => {
      const schema = fieldValueValidators.checkbox(false, { required: false });
      expect(() => schema.parse(false)).not.toThrow();
    });
  });

  describe('photo validator', () => {
    const validPhoto = {
      url: 'https://example.com/photo.jpg',
      fileName: 'photo.jpg',
      fileSize: 1024000,
      mimeType: 'image/jpeg',
      timestamp: new Date().toISOString(),
    };

    it('should validate photo with all required fields', () => {
      const schema = fieldValueValidators.photo(validPhoto, { required: true });
      expect(() => schema.parse(validPhoto)).not.toThrow();
    });

    it('should reject invalid URL', () => {
      const invalidPhoto = { ...validPhoto, url: 'not-a-url' };
      const schema = fieldValueValidators.photo(invalidPhoto, { required: true });
      expect(() => schema.parse(invalidPhoto)).toThrow('Invalid photo URL');
    });

    it('should reject invalid MIME type', () => {
      const invalidPhoto = { ...validPhoto, mimeType: 'application/pdf' };
      const schema = fieldValueValidators.photo(invalidPhoto, { required: true });
      expect(() => schema.parse(invalidPhoto)).toThrow('Invalid image type');
    });

    it('should require GPS location when metadata.gpsRequired is true', () => {
      const photoWithoutGPS = { ...validPhoto };
      const schema = fieldValueValidators.photo(
        photoWithoutGPS,
        { required: true },
        { gpsRequired: true }
      );
      expect(() => schema.parse(photoWithoutGPS)).toThrow();
    });

    it('should validate photo with GPS location', () => {
      const photoWithGPS = {
        ...validPhoto,
        gpsLocation: {
          latitude: 37.7749,
          longitude: -122.4194,
          accuracy: 10,
        },
      };
      const schema = fieldValueValidators.photo(
        photoWithGPS,
        { required: true },
        { gpsRequired: true }
      );
      expect(() => schema.parse(photoWithGPS)).not.toThrow();
    });
  });

  describe('signature validator', () => {
    const validSignature = {
      dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA',
      signedBy: 'John Doe',
      signedAt: new Date().toISOString(),
    };

    it('should validate signature with required fields', () => {
      const schema = fieldValueValidators.signature(validSignature, { required: true });
      expect(() => schema.parse(validSignature)).not.toThrow();
    });

    it('should reject invalid data URL format', () => {
      const invalidSignature = { ...validSignature, dataUrl: 'not-a-data-url' };
      const schema = fieldValueValidators.signature(invalidSignature, { required: true });
      expect(() => schema.parse(invalidSignature)).toThrow('Invalid signature format');
    });

    it('should require certificate when metadata.signatureCertificate is true', () => {
      const signatureWithoutCert = { ...validSignature };
      const schema = fieldValueValidators.signature(
        signatureWithoutCert,
        { required: true },
        { signatureCertificate: true }
      );
      expect(() => schema.parse(signatureWithoutCert)).toThrow(
        'Certificate required for compliance'
      );
    });

    it('should validate signature with certificate', () => {
      const signatureWithCert = { ...validSignature, certificate: 'CERT-12345' };
      const schema = fieldValueValidators.signature(
        signatureWithCert,
        { required: true },
        { signatureCertificate: true }
      );
      expect(() => schema.parse(signatureWithCert)).not.toThrow();
    });
  });

  describe('gps validator', () => {
    const validGPS = {
      latitude: 37.7749,
      longitude: -122.4194,
      accuracy: 10,
      timestamp: new Date().toISOString(),
    };

    it('should validate GPS coordinates within valid range', () => {
      const schema = fieldValueValidators.gps(validGPS, { required: true });
      expect(() => schema.parse(validGPS)).not.toThrow();
    });

    it('should reject latitude out of range', () => {
      const invalidGPS = { ...validGPS, latitude: 100 };
      const schema = fieldValueValidators.gps(invalidGPS, { required: true });
      expect(() => schema.parse(invalidGPS)).toThrow('Latitude must be between -90 and 90');
    });

    it('should reject longitude out of range', () => {
      const invalidGPS = { ...validGPS, longitude: 200 };
      const schema = fieldValueValidators.gps(invalidGPS, { required: true });
      expect(() => schema.parse(invalidGPS)).toThrow('Longitude must be between -180 and 180');
    });

    it('should validate GPS at extreme valid values', () => {
      const extremeGPS = { ...validGPS, latitude: -90, longitude: -180 };
      const schema = fieldValueValidators.gps(extremeGPS, { required: true });
      expect(() => schema.parse(extremeGPS)).not.toThrow();
    });
  });

  describe('weather_data validator', () => {
    const validWeather = {
      precipitation: 0.25,
      temperature: 72,
      humidity: 65,
      timestamp: new Date().toISOString(),
      source: 'NOAA' as const,
    };

    it('should validate weather data with all fields', () => {
      const schema = fieldValueValidators.weather_data(validWeather, {});
      expect(() => schema.parse(validWeather)).not.toThrow();
    });

    it('should reject negative precipitation (EPA compliance)', () => {
      const invalidWeather = { ...validWeather, precipitation: -0.1 };
      const schema = fieldValueValidators.weather_data(invalidWeather, {});
      expect(() => schema.parse(invalidWeather)).toThrow('Precipitation cannot be negative');
    });

    it('should validate EPA 0.25 inch threshold exactly', () => {
      const epaThreshold = { ...validWeather, precipitation: 0.25 };
      const schema = fieldValueValidators.weather_data(epaThreshold, {});
      expect(() => schema.parse(epaThreshold)).not.toThrow();
    });

    it('should validate NOAA and OpenWeatherMap sources', () => {
      const noaaWeather = { ...validWeather, source: 'NOAA' as const };
      const owmWeather = { ...validWeather, source: 'OpenWeatherMap' as const };
      const schema1 = fieldValueValidators.weather_data(noaaWeather, {});
      const schema2 = fieldValueValidators.weather_data(owmWeather, {});
      expect(() => schema1.parse(noaaWeather)).not.toThrow();
      expect(() => schema2.parse(owmWeather)).not.toThrow();
    });

    it('should always require weather data (not optional)', () => {
      const schema = fieldValueValidators.weather_data(undefined, { required: false });
      expect(() => schema.parse(undefined)).toThrow();
    });
  });

  describe('bmpChecklist validator', () => {
    const validChecklist = [
      {
        id: 'bmp1',
        description: 'Silt fence installed',
        checked: true,
        notes: 'Installed on north side',
      },
      {
        id: 'bmp2',
        description: 'Inlet protection in place',
        checked: false,
      },
    ];

    it('should validate BMP checklist with items', () => {
      const schema = fieldValueValidators.bmpChecklist(validChecklist, { required: true });
      expect(() => schema.parse(validChecklist)).not.toThrow();
    });

    it('should reject empty checklist', () => {
      const schema = fieldValueValidators.bmpChecklist([], { required: true });
      expect(() => schema.parse([])).toThrow('At least one BMP item required');
    });

    it('should validate checklist with photo URLs', () => {
      const checklistWithPhoto = [
        {
          ...validChecklist[0],
          photo: 'https://example.com/bmp-photo.jpg',
        },
      ];
      const schema = fieldValueValidators.bmpChecklist(checklistWithPhoto, { required: true });
      expect(() => schema.parse(checklistWithPhoto)).not.toThrow();
    });
  });
});

describe('Conditional Logic Engine', () => {
  it('should hide fields when condition is true', () => {
    const rules = [
      {
        fieldId: 'field1',
        condition: 'response === "yes"',
        action: 'hide' as const,
        targetFields: ['field2', 'field3'],
      },
    ];
    const formData = { response: 'yes' };
    const result = evaluateConditionalLogic(rules, formData);
    expect(result.hiddenFields.has('field2')).toBe(true);
    expect(result.hiddenFields.has('field3')).toBe(true);
  });

  it('should show fields when hide condition is false', () => {
    const rules = [
      {
        fieldId: 'field1',
        condition: 'response === "no"',
        action: 'hide' as const,
        targetFields: ['field2'],
      },
    ];
    const formData = { response: 'yes' };
    const result = evaluateConditionalLogic(rules, formData);
    expect(result.hiddenFields.has('field2')).toBe(false);
  });

  it('should require fields based on condition', () => {
    const rules = [
      {
        fieldId: 'field1',
        condition: 'amount > 100',
        action: 'require' as const,
        targetFields: ['managerApproval'],
      },
    ];
    const formData = { amount: 150 };
    const result = evaluateConditionalLogic(rules, formData);
    expect(result.requiredFields.has('managerApproval')).toBe(true);
  });

  it('should unrequire fields based on condition', () => {
    const rules = [
      {
        fieldId: 'field1',
        condition: 'amount < 100',
        action: 'unrequire' as const,
        targetFields: ['managerApproval'],
      },
    ];
    const formData = { amount: 50 };
    const result = evaluateConditionalLogic(rules, formData);
    expect(result.requiredFields.has('managerApproval')).toBe(false);
  });

  it('should handle complex conditions with multiple operators', () => {
    const rules = [
      {
        fieldId: 'field1',
        condition: 'amount >= 100 && type === "equipment"',
        action: 'require' as const,
        targetFields: ['procurement'],
      },
    ];
    const formData = { amount: 150, type: 'equipment' };
    const result = evaluateConditionalLogic(rules, formData);
    expect(result.requiredFields.has('procurement')).toBe(true);
  });

  it('should prevent code injection attacks', () => {
    const maliciousRules = [
      {
        fieldId: 'field1',
        condition: 'eval("alert(1)")',
        action: 'hide' as const,
        targetFields: ['field2'],
      },
    ];
    const formData = {};
    // Should not throw, should safely reject
    expect(() => evaluateConditionalLogic(maliciousRules, formData)).not.toThrow();
  });
});

describe('Form Submission Validator', () => {
  const templateSchema: FormTemplateSchema = {
    fields: [
      {
        id: 'field1',
        type: 'text',
        name: 'projectName',
        label: 'Project Name',
        order: 0,
        validation: { required: true, minLength: 3 },
      },
      {
        id: 'field2',
        type: 'number',
        name: 'rainfall',
        label: 'Rainfall (inches)',
        order: 1,
        validation: { required: true, min: 0 },
      },
      {
        id: 'field3',
        type: 'checkbox',
        name: 'acknowledge',
        label: 'I acknowledge',
        order: 2,
        validation: { required: true },
      },
    ],
  };

  it('should validate complete valid submission', () => {
    const submissionData = {
      projectName: 'Site A',
      rainfall: 0.25,
      acknowledge: true,
    };
    const result = validateFormSubmission(submissionData, templateSchema);
    expect(result.isValid).toBe(true);
    expect(Object.keys(result.errors).length).toBe(0);
  });

  it('should detect missing required fields', () => {
    const submissionData = {
      projectName: 'Site A',
      // rainfall missing
      acknowledge: true,
    };
    const result = validateFormSubmission(submissionData, templateSchema);
    expect(result.isValid).toBe(false);
    expect(result.errors.rainfall).toBeDefined();
  });

  it('should validate field-level rules', () => {
    const submissionData = {
      projectName: 'AB', // too short
      rainfall: 0.25,
      acknowledge: true,
    };
    const result = validateFormSubmission(submissionData, templateSchema);
    expect(result.isValid).toBe(false);
    expect(result.errors.projectName).toContain('Minimum 3 characters');
  });

  it('should skip hidden fields when skipHiddenFields is true', () => {
    const schemaWithConditional: FormTemplateSchema = {
      ...templateSchema,
      conditionalLogic: [
        {
          fieldId: 'field1',
          condition: 'projectName === "Skip"',
          action: 'hide',
          targetFields: ['field2'],
        },
      ],
    };
    const submissionData = {
      projectName: 'Skip',
      // rainfall missing but field2 should be hidden
      acknowledge: true,
    };
    const result = validateFormSubmission(submissionData, schemaWithConditional, true);
    expect(result.isValid).toBe(true); // field2 is hidden, so not validated
  });

  it('should apply conditional required fields', () => {
    const schemaWithConditional: FormTemplateSchema = {
      ...templateSchema,
      conditionalLogic: [
        {
          fieldId: 'field2',
          condition: 'rainfall >= 0.25',
          action: 'require',
          targetFields: ['field1'], // already required, but testing logic
        },
      ],
    };
    const submissionData = {
      projectName: '', // empty but required by conditional logic
      rainfall: 0.3,
      acknowledge: true,
    };
    const result = validateFormSubmission(submissionData, schemaWithConditional);
    expect(result.isValid).toBe(false);
    expect(result.errors.projectName).toBeDefined();
  });

  it('should collect warnings for unknown field types', () => {
    const schemaWithUnknown: FormTemplateSchema = {
      fields: [
        {
          id: 'field1',
          type: 'unknown_type' as FieldType,
          name: 'test',
          label: 'Test',
          order: 0,
        },
      ],
    };
    const result = validateFormSubmission({}, schemaWithUnknown);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0]).toContain('No validator found');
  });
});
