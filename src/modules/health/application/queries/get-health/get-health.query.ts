import { Query } from '@nestjs/cqrs';

export interface HealthStatus {
  readonly status: 'ok';
}

export class GetHealthQuery extends Query<HealthStatus> {}
