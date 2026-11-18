import { ApiProperty } from '@nestjs/swagger';
import type { HealthStatus } from '../../../../application/queries/get-health/get-health.query.js';

export class HealthResponseDto implements HealthStatus {
  @ApiProperty({ type: String, enum: ['ok'], example: 'ok' })
  readonly status!: HealthStatus['status'];
}
