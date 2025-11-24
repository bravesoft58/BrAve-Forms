import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '@/app.module';
import { PrismaService } from '@/modules/database/prisma.service';
import { FormStatus } from '@prisma/client';

describe('Cloning Workflow Integration Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let testOrgId: string;
  let testUserId: string;
  let testTemplateId: string;
  let testSubmissionId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    testOrgId = 'org_qd_default';
    testUserId = 'test-user-id';
    testTemplateId = `test-template-${Date.now()}`;

    const template = await prisma.formTemplate.create({
      data: {
        id: testTemplateId,
        name: 'Test Cloning Template',
        slug: `test-cloning-template-${Date.now()}`,
        description: 'Template for cloning integration tests',
        schema: {
          sections: [
            {
              id: 'section-1',
              fields: [
                { id: 'textField', type: 'text', label: 'Text Field' },
                { id: 'numberField', type: 'number', label: 'Number Field' },
                { id: 'dateField', type: 'date', label: 'Date Field' },
                { id: 'signatureField', type: 'signature', label: 'Signature' },
              ],
            },
          ],
        },
        version: 1,
        orgId: testOrgId,
        category: 'TEST',
        isActive: true,
        createdBy: testUserId,
      },
    });

    const submission = await prisma.formSubmission.create({
      data: {
        id: `test-submission-${Date.now()}`,
        templateId: template.id,
        data: {
          textField: 'Sample text',
          numberField: 42,
          dateField: '2025-10-22',
          signatureField: 'signature-data',
        },
        status: FormStatus.SUBMITTED,
        orgId: testOrgId,
        createdBy: testUserId,
        submittedBy: testUserId,
        submittedAt: new Date(),
      },
    });

    testSubmissionId = submission.id;
  });

  afterAll(async () => {
    await prisma.formSubmission.deleteMany({
      where: { orgId: testOrgId },
    });
    await prisma.formTemplate.deleteMany({
      where: { orgId: testOrgId },
    });
    await app.close();
  });

  describe('POST /graphql - cloneSubmission', () => {
    it('should clone submission via GraphQL with KEEP_ALL mode', async () => {
      const query = `
        mutation CloneSubmission($sourceId: ID!) {
          cloneSubmission(sourceId: $sourceId) {
            id
            status
            templateId
            data
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer mock-clerk-token-${testOrgId}`)
        .send({
          query,
          variables: {
            sourceId: testSubmissionId,
          },
        })
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.cloneSubmission).toBeDefined();
      expect(response.body.data.cloneSubmission.id).not.toBe(testSubmissionId);
      expect(response.body.data.cloneSubmission.status).toBe('DRAFT');
      expect(response.body.data.cloneSubmission.templateId).toBe(testTemplateId);

      const clonedData = response.body.data.cloneSubmission.data;
      expect(clonedData.textField).toBe('Sample text');
      expect(clonedData.numberField).toBe(42);
      expect(clonedData.dateField).toBeNull();
      expect(clonedData.signatureField).toBeNull();
    });

    it('should reject unauthorized cloning attempt', async () => {
      const query = `
        mutation CloneSubmission($sourceId: ID!) {
          cloneSubmission(sourceId: $sourceId) {
            id
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query,
          variables: {
            sourceId: testSubmissionId,
          },
        })
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('Unauthorized');
    });
  });

  describe('POST /graphql - copyYesterdaysLog', () => {
    beforeAll(async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(12, 0, 0, 0);

      await prisma.formSubmission.create({
        data: {
          id: `yesterday-submission-${Date.now()}`,
          templateId: testTemplateId,
          data: {
            textField: 'Yesterday text',
            numberField: 100,
            dateField: yesterday.toISOString().split('T')[0],
          },
          status: FormStatus.SUBMITTED,
          orgId: testOrgId,
          createdBy: testUserId,
          submittedBy: testUserId,
          submittedAt: yesterday,
        },
      });
    });

    it("should copy yesterday's log via GraphQL", async () => {
      const query = `
        mutation CopyYesterdaysLog($templateId: ID!) {
          copyYesterdaysLog(templateId: $templateId) {
            id
            status
            templateId
            data
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer mock-clerk-token-${testOrgId}`)
        .send({
          query,
          variables: {
            templateId: testTemplateId,
          },
        })
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.copyYesterdaysLog).toBeDefined();
      expect(response.body.data.copyYesterdaysLog.status).toBe('DRAFT');
      expect(response.body.data.copyYesterdaysLog.templateId).toBe(testTemplateId);

      const clonedData = response.body.data.copyYesterdaysLog.data;
      expect(clonedData.textField).toBe('Yesterday text');
      expect(clonedData.numberField).toBe(100);
      expect(clonedData.dateField).toBeNull();
    });

    it('should return error when no yesterday submission exists', async () => {
      const nonExistentTemplateId = 'non-existent-template-id';

      const query = `
        mutation CopyYesterdaysLog($templateId: ID!) {
          copyYesterdaysLog(templateId: $templateId) {
            id
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer mock-clerk-token-${testOrgId}`)
        .send({
          query,
          variables: {
            templateId: nonExistentTemplateId,
          },
        })
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('not found');
    });
  });
});
