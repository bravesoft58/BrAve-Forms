import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/modules/database/prisma.service';
import { Prisma, FormCategory } from '@prisma/client';

interface CloneTemplateOptions {
  name?: string;
  description?: string;
  category?: FormCategory;
  schema?: Prisma.JsonValue;
}

@Injectable()
export class TemplateCloningService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Clone a form template from one organization to another (or within same org)
   *
   * @param sourceTemplateId - ID of template to clone
   * @param targetOrgId - Organization ID to create cloned template in
   * @param targetUserId - User ID who is creating the clone
   * @param options - Optional customizations (name, description, category, schema)
   * @returns Newly created cloned template
   * @throws NotFoundException if source template doesn't exist
   */
  async cloneTemplate(
    sourceTemplateId: string,
    targetOrgId: string,
    targetUserId: string,
    options?: CloneTemplateOptions
  ) {
    // Fetch source template
    const sourceTemplate = await this.prisma.formTemplate.findFirst({
      where: { id: sourceTemplateId },
    });

    if (!sourceTemplate) {
      throw new NotFoundException(`Source template with ID ${sourceTemplateId} not found`);
    }

    // Prepare cloned template data
    const clonedName = options?.name || `${sourceTemplate.name} (Copy)`;
    const clonedDescription = options?.description || sourceTemplate.description;
    const clonedCategory = options?.category || sourceTemplate.category;
    const clonedSchema = options?.schema || sourceTemplate.schema;

    // Create cloned template
    const clonedTemplate = await this.prisma.formTemplate.create({
      data: {
        orgId: targetOrgId,
        name: clonedName,
        description: clonedDescription,
        category: clonedCategory,
        schema: clonedSchema,
        compliance: sourceTemplate.compliance,
        version: 1, // Always start at version 1 for clones
        createdBy: targetUserId,
      },
    });

    // Create initial version snapshot
    await this.prisma.formTemplateVersion.create({
      data: {
        templateId: clonedTemplate.id,
        version: 1,
        schema: clonedTemplate.schema,
        changeLog: `Cloned from template ${sourceTemplateId}`,
        createdBy: targetUserId,
      },
    });

    return clonedTemplate;
  }

  /**
   * Clone a template and customize it for a specific project
   *
   * @param sourceTemplateId - ID of template to clone
   * @param projectId - Project ID to associate with (for metadata/tracking)
   * @param customizations - Template customizations
   * @param orgId - Organization ID
   * @param userId - User ID creating the customization
   * @returns Newly created customized template
   */
  async customizeTemplateForProject(
    sourceTemplateId: string,
    projectId: string,
    customizations: CloneTemplateOptions,
    orgId: string,
    userId: string
  ) {
    // Reuse cloneTemplate logic with customizations
    return this.cloneTemplate(sourceTemplateId, orgId, userId, customizations);
  }
}
