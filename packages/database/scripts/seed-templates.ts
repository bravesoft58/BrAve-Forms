import { PrismaClient, FormCategory } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// Map template category strings to FormCategory enum
function mapCategory(category: string): FormCategory {
  const categoryMap: Record<string, FormCategory> = {
    EPA_SWPPP: 'EPA_SWPPP',
    EPA_CGP: 'EPA_CGP',
    OSHA_SAFETY: 'OSHA_SAFETY',
    STATE_PERMIT: 'STATE_PERMIT',
    CUSTOM: 'CUSTOM',
    DAILY_LOG: 'CUSTOM',
    SAFETY: 'OSHA_SAFETY',
    QUALITY_CONTROL: 'CUSTOM',
    EQUIPMENT: 'CUSTOM',
    LOGISTICS: 'CUSTOM',
    COMPLIANCE: 'EPA_SWPPP',
  };
  return categoryMap[category] || 'CUSTOM';
}

async function main() {
  console.log('Seeding form templates...\n');

  // Ensure system organization exists for system templates
  const systemOrg = await prisma.organization.upsert({
    where: { clerkOrgId: 'system' },
    update: {},
    create: {
      clerkOrgId: 'system',
      name: 'System Templates',
      plan: 'ENTERPRISE',
    },
  });
  console.log(`System organization ready (ID: ${systemOrg.id})\n`);

  const templatesDir = path.join(__dirname, '..', 'templates');
  const files = fs.readdirSync(templatesDir).filter((f) => f.endsWith('.json')).sort();

  console.log(`Found ${files.length} template files\n`);

  let successCount = 0;
  let errorCount = 0;
  let skippedCount = 0;

  for (const file of files) {
    const filePath = path.join(templatesDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const template = JSON.parse(content);

    try {
      // Check if template already exists for system org
      const existing = await prisma.formTemplate.findFirst({
        where: {
          orgId: systemOrg.id,
          name: template.name,
        },
      });

      if (existing) {
        console.log(`[SKIP] ${file} - already exists (ID: ${existing.id})`);
        skippedCount++;
        continue;
      }

      // Create system template
      const created = await prisma.formTemplate.create({
        data: {
          orgId: systemOrg.id,
          name: template.name,
          description: template.description,
          category: mapCategory(template.category),
          version: 1,
          schema: template.schema,
          compliance: template.compliance || null,
          isActive: true,
          createdBy: 'system',
        },
      });

      // Create initial version snapshot
      await prisma.formTemplateVersion.create({
        data: {
          templateId: created.id,
          version: 1,
          schema: template.schema,
          changeLog: `Initial system template from ${file}`,
          createdBy: 'system',
        },
      });

      console.log(`[OK] Created ${file} (ID: ${created.id})`);
      successCount++;
    } catch (error) {
      console.error(`[ERROR] Failed to create ${file}:`, (error as Error).message);
      errorCount++;
    }
  }

  console.log(`\nSeeding Summary:`);
  console.log(`   Created: ${successCount} templates`);
  console.log(`   Errors: ${errorCount}`);
  console.log(`   Skipped: ${skippedCount} (already exist)`);
  console.log(`   Total: ${files.length} files processed\n`);

  if (errorCount > 0) {
    process.exit(1);
  }
}

main()
  .catch((error) => {
    console.error('[FATAL] Error during seeding:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
