import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetHealthQuery, type HealthStatus } from './get-health.query.js';

@QueryHandler(GetHealthQuery)
export class GetHealthHandler implements IQueryHandler<GetHealthQuery> {
  execute(): Promise<HealthStatus> {
    return Promise.resolve({ status: 'ok' });
  }
}
