import { Module } from '@nestjs/common';
import { HealthController } from './adapters/in/http/get-health/get-health.controller.js';
import { GetHealthHandler } from './application/queries/get-health/get-health.handler.js';

@Module({
  controllers: [HealthController],
  providers: [GetHealthHandler],
})
export class HealthModule {}
