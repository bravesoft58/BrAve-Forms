import { Resolver } from '@nestjs/graphql';
import { QueueService } from './queue.service';

@Resolver()
export class QueueResolver {
  constructor(private readonly queueService: QueueService) {}
}
