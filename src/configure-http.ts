import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import type { NextFunction, Request, Response } from 'express';
import { sessionCookieName } from './modules/identity/adapters/in/http/session-cookie.js';

const MUTATING_HTTP_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export function configureHttp(
  app: INestApplication,
  configService: ConfigService,
): void {
  const frontendOrigin = configService.getOrThrow<string>('FRONTEND_ORIGIN');

  app.enableCors({
    origin: frontendOrigin,
    credentials: true,
  });
  app.use(cookieParser());
  app.use((request: Request, response: Response, next: NextFunction): void => {
    if (!MUTATING_HTTP_METHODS.has(request.method)) return next();
    if (request.header('origin') !== frontendOrigin) {
      response.status(403).json({
        statusCode: 403,
        message: 'Origine de requête non autorisée.',
        error: 'Forbidden',
      });
      return;
    }
    next();
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      validationError: { target: false, value: false },
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('API des CV interactifs')
    .setVersion('0.0.1')
    .addCookieAuth(
      sessionCookieName(configService),
      { type: 'apiKey', in: 'cookie' },
      'session',
    )
    .build();

  SwaggerModule.setup('api', app, () =>
    SwaggerModule.createDocument(app, config),
  );
}
