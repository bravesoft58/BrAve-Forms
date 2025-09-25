import { Resolver } from '@nestjs/graphql';
import { ComplianceService } from './compliance.service';

@Resolver()
export class ComplianceResolver {
  constructor(private readonly complianceService: ComplianceService) {}
}
