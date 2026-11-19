import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module.js';
import { configureHttp } from './configure-http.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableShutdownHooks();
  configureHttp(app, app.get(ConfigService));
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
