import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Creating test submission for Issue 107 testing...');

  // Find or create organization with clerkOrgId matching what backend expects
  // Backend uses DEFAULT_ORG_ID = 'org_qd_default' in single-tenant mode
  let organization = await prisma.organization.findFirst({
    where: { clerkOrgId: 'org_qd_default' },
  });

  if (!organization) {
    // Try to find any org and update it, or create new
    const existingOrg = await prisma.organization.findFirst();
    if (existingOrg) {
      organization = await prisma.organization.update({
        where: { id: existingOrg.id },
        data: { clerkOrgId: 'org_qd_default' },
      });
      console.log('Updated organization to use org_qd_default:', organization.id);
    } else {
      organization = await prisma.organization.create({
        data: {
          clerkOrgId: 'org_qd_default',
          name: 'Default Organization',
          plan: 'PROFESSIONAL',
        },
      });
      console.log('Created organization:', organization.id);
    }
  }

  console.log('Using organization:', organization.id, 'clerkOrgId:', organization.clerkOrgId);

  // Get or create a test template
  let template = await prisma.formTemplate.findFirst({
    where: {
      orgId: organization.id,
    },
  });

  if (!template) {
    console.log('Creating test template...');
    template = await prisma.formTemplate.create({
      data: {
        orgId: organization.id,
        name: 'Daily Log Template',
        description: 'Test template for Issue 107',
        category: 'CUSTOM',
        schema: {
          sections: [
            {
              id: 'section-1',
              title: 'Site Information',
              fields: [
                {
                  id: 'site_name',
                  type: 'text',
                  label: 'Site Name',
                  required: true,
                },
                {
                  id: 'inspector_name',
                  type: 'text',
                  label: 'Inspector Name',
                  required: true,
                },
                {
                  id: 'inspection_date',
                  type: 'date',
                  label: 'Inspection Date',
                  required: true,
                },
                {
                  id: 'site_photo',
                  type: 'photo',
                  label: 'Site Photo',
                  required: false,
                },
              ],
            },
          ],
        },
        createdBy: 'dev-user-123',
        version: 1,
      },
    });
    console.log('Created template:', template.id);
  }

  // Create test submission
  const submission = await prisma.formSubmission.create({
    data: {
      orgId: organization.id,
      templateId: template.id,
      submittedBy: 'dev-user-123',
      status: 'SUBMITTED',
      data: {
        site_name: 'Test Construction Site',
        inspector_name: 'John Doe',
        inspection_date: '2025-11-24',
        site_photo: 'data:image/jpeg;base64,test-photo-data',
      },
      submittedAt: new Date(),
    },
    include: {
      template: true,
    },
  });

  console.log('\n✅ Test submission created successfully!');
  console.log('Submission ID:', submission.id);
  console.log('Template ID:', submission.templateId);
  console.log('Organization ID:', submission.orgId);
  console.log('Organization clerkOrgId:', organization.clerkOrgId);
  console.log('\nYou can now test Issue 107 at:');
  console.log(`http://localhost:30102/submissions/${submission.id}`);
}

main()
  .catch((e) => {
    console.error('Error creating test submission:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
