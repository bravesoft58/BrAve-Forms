import { Resolver } from '@nestjs/graphql';
import { ReportsService } from './reports.service';

@Resolver()
export class ReportsResolver {
  constructor(private readonly reportsService: ReportsService) {}
}
