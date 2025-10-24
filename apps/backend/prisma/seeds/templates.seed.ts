import { PrismaClient, FormCategory } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface TemplateData {
  name: string;
  description: string;
  category: string;
  schema: any;
  compliance: any;
  version: string;
  offlineCapable: boolean;
  metadata: any;
}

// Map template categories to Prisma FormCategory enum
function mapCategory(category: string): FormCategory {
  const categoryMap: Record<string, FormCategory> = {
    DAILY_LOG: 'CUSTOM',
    SAFETY: 'OSHA_SAFETY',
    QUALITY_CONTROL: 'CUSTOM',
    EQUIPMENT: 'CUSTOM',
    LOGISTICS: 'CUSTOM',
    COMPLIANCE: 'EPA_SWPPP', // Assuming SWPPP for compliance templates
    EPA_SWPPP: 'EPA_SWPPP',
    EPA_CGP: 'EPA_CGP',
    OSHA_SAFETY: 'OSHA_SAFETY',
    STATE_PERMIT: 'STATE_PERMIT',
    CUSTOM: 'CUSTOM',
  };

  const mapped = categoryMap[category];
  if (!mapped) {
    console.warn(`Warning: Unknown category "${category}", defaulting to CUSTOM`);
    return 'CUSTOM';
  }
  return mapped;
}

async function seedTemplates() {
  console.log('Starting template seeding...\n');

  // Ensure 'system' organization exists for system templates
  const systemOrg = await prisma.organization.upsert({
    where: { clerkOrgId: 'system' },
    update: {},
    create: {
      clerkOrgId: 'system',
      name: 'System Templates',
      plan: 'ENTERPRISE',
    },
  });
  console.log(`✓ System organization ready (ID: ${systemOrg.id})\n`);

  // Templates are in packages/database/templates/
  const templatesDir = path.join(
    __dirname,
    '..',
    '..',
    '..',
    '..',
    'packages',
    'database',
    'templates'
  );

  console.log(`Reading templates from: ${templatesDir}\n`);

  if (!fs.existsSync(templatesDir)) {
    console.error(`Templates directory not found: ${templatesDir}`);
    process.exit(1);
  }

  const templateFiles = fs
    .readdirSync(templatesDir)
    .filter((f) => f.endsWith('.json'))
    .sort(); // Sort to ensure consistent ordering

  let totalSeeded = 0;
  let skippedCount = 0;

  for (const templateFile of templateFiles) {
    const templatePath = path.join(templatesDir, templateFile);

    try {
      const templateData: TemplateData = JSON.parse(fs.readFileSync(templatePath, 'utf-8'));

      // Check if template already exists (by name)
      const existing = await prisma.formTemplate.findFirst({
        where: {
          orgId: systemOrg.id,
          name: templateData.name,
        },
      });

      if (existing) {
        console.log(`⊘ Skipped: ${templateData.name} (already exists)`);
        skippedCount++;
        continue;
      }

      // Create system template (no specific org - available to all orgs for cloning)
      const template = await prisma.formTemplate.create({
        data: {
          orgId: systemOrg.id, // System organization ID
          name: templateData.name,
          description: templateData.description,
          category: mapCategory(templateData.category),
          schema: templateData.schema,
          compliance: templateData.compliance || null,
          version: 1,
          isActive: true,
          createdBy: 'system',
        },
      });

      // Create initial version snapshot
      await prisma.formTemplateVersion.create({
        data: {
          templateId: template.id,
          version: 1,
          schema: templateData.schema,
          changeLog: `Initial system template from ${templateFile}`,
          createdBy: 'system',
        },
      });

      console.log(`✓ Seeded: ${templateData.name} (${templateData.category})`);
      totalSeeded++;
    } catch (error) {
      console.error(`✗ Error seeding ${templateFile}:`, error);
      throw error; // Stop on error
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`✓ Template seeding complete!`);
  console.log(`  - Total templates processed: ${templateFiles.length}`);
  console.log(`  - Successfully seeded: ${totalSeeded}`);
  console.log(`  - Skipped (already exist): ${skippedCount}`);
  console.log(`${'='.repeat(60)}\n`);
}

seedTemplates()
  .catch((e) => {
    console.error('\n✗ Template seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
