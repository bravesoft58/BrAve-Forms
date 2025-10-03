import { FormsModule } from './forms.module';
import { FormsResolver } from './forms.resolver';
import { FormsService } from './forms.service';
import {
  FormTemplate,
  FormSubmission,
  CreateFormTemplateInput,
  UpdateFormTemplateInput,
  FormCategory,
  FormStatus,
} from './forms.types';

describe('FormsModule Configuration', () => {
  it('should export FormsResolver', () => {
    expect(FormsResolver).toBeDefined();
    expect(typeof FormsResolver).toBe('function');
  });

  it('should export FormsService', () => {
    expect(FormsService).toBeDefined();
    expect(typeof FormsService).toBe('function');
  });

  it('should export FormsModule', () => {
    expect(FormsModule).toBeDefined();
    expect(typeof FormsModule).toBe('function');
  });
});

describe('GraphQL Types', () => {
  it('should export FormTemplate ObjectType', () => {
    expect(FormTemplate).toBeDefined();
    const template = new FormTemplate();
    expect(template).toBeInstanceOf(FormTemplate);
  });

  it('should export FormSubmission ObjectType', () => {
    expect(FormSubmission).toBeDefined();
    const submission = new FormSubmission();
    expect(submission).toBeInstanceOf(FormSubmission);
  });

  it('should export CreateFormTemplateInput', () => {
    expect(CreateFormTemplateInput).toBeDefined();
    const input = new CreateFormTemplateInput();
    expect(input).toBeInstanceOf(CreateFormTemplateInput);
  });

  it('should export UpdateFormTemplateInput', () => {
    expect(UpdateFormTemplateInput).toBeDefined();
    const input = new UpdateFormTemplateInput();
    expect(input).toBeInstanceOf(UpdateFormTemplateInput);
  });

  it('should export FormCategory enum', () => {
    expect(FormCategory).toBeDefined();
    expect(FormCategory.EPA_SWPPP).toBe('EPA_SWPPP');
    expect(FormCategory.EPA_CGP).toBe('EPA_CGP');
    expect(FormCategory.OSHA_SAFETY).toBe('OSHA_SAFETY');
  });

  it('should export FormStatus enum', () => {
    expect(FormStatus).toBeDefined();
    expect(FormStatus.DRAFT).toBe('DRAFT');
    expect(FormStatus.SUBMITTED).toBe('SUBMITTED');
    expect(FormStatus.APPROVED).toBe('APPROVED');
    expect(FormStatus.REJECTED).toBe('REJECTED');
  });
});

describe('FormsResolver Methods', () => {
  it('should have formTemplates query method', () => {
    expect(FormsResolver.prototype.formTemplates).toBeDefined();
    expect(typeof FormsResolver.prototype.formTemplates).toBe('function');
  });

  it('should have formTemplate query method', () => {
    expect(FormsResolver.prototype.formTemplate).toBeDefined();
    expect(typeof FormsResolver.prototype.formTemplate).toBe('function');
  });

  it('should have createFormTemplate mutation method', () => {
    expect(FormsResolver.prototype.createFormTemplate).toBeDefined();
    expect(typeof FormsResolver.prototype.createFormTemplate).toBe('function');
  });

  it('should have updateFormTemplate mutation method', () => {
    expect(FormsResolver.prototype.updateFormTemplate).toBeDefined();
    expect(typeof FormsResolver.prototype.updateFormTemplate).toBe('function');
  });

  it('should have deleteFormTemplate mutation method', () => {
    expect(FormsResolver.prototype.deleteFormTemplate).toBeDefined();
    expect(typeof FormsResolver.prototype.deleteFormTemplate).toBe('function');
  });
});
