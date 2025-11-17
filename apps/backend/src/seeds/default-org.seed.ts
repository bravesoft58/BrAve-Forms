import { PrismaClient } from '@prisma/client';
import { DEFAULT_ORG_ID, DEFAULT_ORG_NAME, DEFAULT_ORG_SLUG } from '../common/constants';

const prisma = new PrismaClient();

async function seedDefaultOrganization() {
  console.log('Seeding default organization for Q&D Construction...');

  // Check if organization exists
  const existing = await prisma.organization.findUnique({
    where: { clerkOrgId: DEFAULT_ORG_ID },
  });

  if (existing) {
    console.log('Default organization already exists:', existing.name);
    return;
  }

  // Create default organization
  const org = await prisma.organization.create({
    data: {
      id: DEFAULT_ORG_ID,
      clerkOrgId: DEFAULT_ORG_ID,
      name: DEFAULT_ORG_NAME,
      plan: 'STARTER',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  console.log('Created default organization:', org.name, `(ID: ${org.id})`);
}

seedDefaultOrganization()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

