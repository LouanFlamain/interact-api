import { Controller, Get, Inject } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetHealthQuery } from '../../../../application/queries/get-health/get-health.query.js';
import { Public } from '../../../../../identity/adapters/in/http/session-auth.guard.js';
import { HealthResponseDto } from './get-health-response.dto.js';

@ApiTags('Health')
@Public()
@Controller('health')
export class HealthController {
  constructor(@Inject(QueryBus) private readonly queries: QueryBus) {}

  @Get()
  @ApiOperation({
    operationId: 'getHealth',
    summary: 'Vérifie que l’API répond',
  })
  @ApiOkResponse({
    type: HealthResponseDto,
    description: 'Le processus répond.',
  })
  getHealth(): Promise<HealthResponseDto> {
    return this.queries.execute(new GetHealthQuery());
  }
}
