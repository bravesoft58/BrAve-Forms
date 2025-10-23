import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/modules/database/prisma.service';
import { Prisma, FormCategory } from '@prisma/client';

interface CloneTemplateOptions {
  name?: string;
  description?: string;
  category?: FormCategory;
  schema?: Prisma.JsonValue;
  offlineCreated?: boolean;
}

@Injectable()
export class TemplateCloningService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Clone a form template within the same organization
   *
   * SECURITY: Only allows cloning templates from the same organization to prevent
   * cross-tenant data leaks and IP theft of custom forms.
   *
   * COMPLIANCE: Validates EPA/OSHA required fields are not removed from compliance forms.
   *
   * OFFLINE: Supports offline template cloning with sync tracking.
   *
   * @param sourceTemplateId - ID of template to clone
   * @param targetOrgId - Organization ID to create cloned template in (must match source)
   * @param targetUserId - User ID who is creating the clone
   * @param options - Optional customizations (name, description, category, schema, offlineCreated)
   * @returns Newly created cloned template
   * @throws NotFoundException if source template doesn't exist
   * @throws ForbiddenException if attempting cross-tenant clone
   * @throws BadRequestException if EPA/OSHA required fields removed
   */
  async cloneTemplate(
    sourceTemplateId: string,
    targetOrgId: string,
    targetUserId: string,
    options?: CloneTemplateOptions
  ) {
    // CRITICAL-1 FIX: Multi-tenant security validation
    // Fetch source template with orgId validation
    const sourceTemplate = await this.prisma.formTemplate.findFirst({
      where: {
        id: sourceTemplateId,
        orgId: targetOrgId, // SECURITY: Ensure template belongs to requesting org
      },
    });

    if (!sourceTemplate) {
      // Check if template exists in another org (security logging opportunity)
      const templateExistsElsewhere = await this.prisma.formTemplate.findFirst({
        where: { id: sourceTemplateId },
        select: { id: true, orgId: true },
      });

      if (templateExistsElsewhere) {
        throw new ForbiddenException(
          `Template ${sourceTemplateId} exists but does not belong to your organization. Cross-tenant template cloning is not permitted.`
        );
      }

      throw new NotFoundException(
        `Source template with ID ${sourceTemplateId} not found or you do not have access to it.`
      );
    }

    // Prepare cloned template data
    const clonedName = options?.name || `${sourceTemplate.name} (Copy)`;
    const clonedDescription = options?.description || sourceTemplate.description;
    const clonedCategory = options?.category || sourceTemplate.category;
    const clonedSchema = options?.schema || sourceTemplate.schema;
    const offlineCreated = options?.offlineCreated || false;

    // CRITICAL-3 FIX: EPA/OSHA compliance validation
    if (sourceTemplate.compliance && options?.schema) {
      this.validateComplianceFields(sourceTemplate.compliance, clonedSchema);
    }

    // CRITICAL-4 FIX: Database transaction for atomicity
    // Wrap template and version creation in transaction to ensure audit trail integrity
    const clonedTemplate = await this.prisma.$transaction(async (tx) => {
      // Create cloned template
      const newTemplate = await tx.formTemplate.create({
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

      // Create initial version snapshot (atomic with template creation)
      await tx.formTemplateVersion.create({
        data: {
          templateId: newTemplate.id,
          version: 1,
          schema: newTemplate.schema,
          changeLog: offlineCreated
            ? `Cloned from template ${sourceTemplateId} (offline)`
            : `Cloned from template ${sourceTemplateId}`,
          createdBy: targetUserId,
        },
      });

      return newTemplate;
    });

    // CRITICAL-2 FIX: Offline capability metadata
    // Note: offlineCreated flag tracked in changelog for sync conflict resolution
    // Future enhancement: Add dedicated offline_metadata JSONB field for sync tracking

    return clonedTemplate;
  }

  /**
   * Validate that EPA/OSHA required compliance fields are not removed
   *
   * COMPLIANCE: Prevents $25,000-$50,000/day EPA fines by ensuring critical
   * compliance fields (0.25" rain threshold, inspection windows, etc.) remain intact.
   *
   * @param sourceCompliance - Original template compliance metadata
   * @param customSchema - Customized schema to validate
   * @throws BadRequestException if required compliance fields are missing
   */
  private validateComplianceFields(
    sourceCompliance: Prisma.JsonValue,
    customSchema: Prisma.JsonValue
  ): void {
    const compliance = sourceCompliance as { regulation?: string; requiredFields?: string[] };
    const schema = customSchema as { fields?: Array<{ id: string }> };

    // EPA CGP and OSHA forms have critical required fields
    const isEpaOrOsha =
      compliance?.regulation?.includes('EPA') || compliance?.regulation?.includes('OSHA');

    if (!isEpaOrOsha || !compliance?.requiredFields || !schema?.fields) {
      return; // Not a compliance form or no required fields specified
    }

    const customFieldIds = schema.fields.map((f) => f.id);
    const missingFields = compliance.requiredFields.filter(
      (required) => !customFieldIds.includes(required)
    );

    if (missingFields.length > 0) {
      throw new BadRequestException(
        `Cannot remove required compliance fields: ${missingFields.join(', ')}. ` +
          `Regulation: ${compliance.regulation}. ` +
          `Removing these fields may result in EPA/OSHA violations and penalties up to $50,000 per day.`
      );
    }
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
