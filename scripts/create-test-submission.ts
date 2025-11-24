import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Creating test submission for Issue 107 testing...');

  // Get or create test organization matching mock auth
  let organization = await prisma.organization.findFirst({
    where: { clerkOrgId: 'dev-org-123' },
  });

  if (!organization) {
    console.log('Creating test organization...');
    // First, find an existing org to get its structure, or create new
    const existingOrg = await prisma.organization.findFirst();
    if (existingOrg) {
      // Use existing org's ID structure but update clerkOrgId
      organization = await prisma.organization.update({
        where: { id: existingOrg.id },
        data: { clerkOrgId: 'dev-org-123' },
      });
      console.log('Updated organization:', organization.id);
    } else {
      organization = await prisma.organization.create({
        data: {
          clerkOrgId: 'dev-org-123',
          name: 'Test Organization',
          plan: 'PROFESSIONAL',
        },
      });
      console.log('Created organization:', organization.id);
    }
  }

  // Get or create a test template
  let template = await prisma.formTemplate.findFirst({
    where: {
      orgId: organization.id,
      name: { contains: 'Daily' },
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
