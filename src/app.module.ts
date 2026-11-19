import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './infrastructure/persistence/prisma/prisma.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { IdentityModule } from './modules/identity/identity.module.js';
import { SessionAuthGuard } from './modules/identity/adapters/in/http/session-auth.guard.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    CqrsModule.forRoot(),
    PrismaModule,
    IdentityModule,
    HealthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useExisting: SessionAuthGuard,
    },
  ],
})
export class AppModule {}
