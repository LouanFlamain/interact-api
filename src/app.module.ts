import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { PrismaModule } from './infrastructure/persistence/prisma/prisma.module.js';
import { HealthModule } from './modules/health/health.module.js';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), CqrsModule.forRoot(), PrismaModule, HealthModule],
})
export class AppModule {}
