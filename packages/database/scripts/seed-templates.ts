import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding form templates...\n');

  const templatesDir = path.join(__dirname, '..', 'templates');
  const files = fs.readdirSync(templatesDir).filter((f) => f.endsWith('.json')).sort();

  console.log(`Found ${files.length} template files\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const file of files) {
    const filePath = path.join(templatesDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const template = JSON.parse(content);

    try {
      // Check if template already exists
      const existing = await prisma.formTemplate.findFirst({
        where: {
          name: template.name,
          isSystemTemplate: true,
        },
      });

      if (existing) {
        console.log(`⏭️  Skipping ${file} - already exists (ID: ${existing.id})`);
        continue;
      }

      // Create system template (no orgId - available to all orgs for cloning)
      const created = await prisma.formTemplate.create({
        data: {
          name: template.name,
          description: template.description,
          category: template.category,
          version: template.version,
          schema: template.schema,
          compliance: template.compliance || null,
          offlineCapable: template.offlineCapable ?? true,
          metadata: template.metadata || {},
          isSystemTemplate: true,
          isActive: true,
          // No orgId - system templates are available to all organizations for cloning
        },
      });

      console.log(`✅ Created ${file} (ID: ${created.id})`);
      successCount++;
    } catch (error) {
      console.error(`❌ Failed to create ${file}:`, (error as Error).message);
      errorCount++;
    }
  }

  console.log(`\n📊 Seeding Summary:`);
  console.log(`   ✅ ${successCount} templates created`);
  console.log(`   ❌ ${errorCount} errors`);
  console.log(`   ⏭️  ${files.length - successCount - errorCount} skipped (already exist)`);
  console.log(`   📁 ${files.length} total files processed\n`);

  if (errorCount > 0) {
    process.exit(1);
  }
}

main()
  .catch((error) => {
    console.error('❌ Fatal error during seeding:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
