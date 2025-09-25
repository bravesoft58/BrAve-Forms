import { Resolver } from '@nestjs/graphql';
import { InspectionsService } from './inspections.service';

@Resolver()
export class InspectionsResolver {
  constructor(private readonly inspectionsService: InspectionsService) {}
}
