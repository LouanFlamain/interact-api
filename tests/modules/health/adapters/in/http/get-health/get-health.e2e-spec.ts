import type { Server } from 'node:http';
import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../../../../../../src/app.module.js';
import { configureHttp } from '../../../../../../../src/configure-http.js';

describe('GET /api/health', () => {
  let app: INestApplication<Server>;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    configureHttp(app, app.get(ConfigService));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns the public liveness response', async () => {
    await request(app.getHttpServer())
      .get('/api/health')
      .expect(200)
      .expect('Content-Type', /json/)
      .expect({ status: 'ok' });
  });

  it('publishes its response in the OpenAPI document', async () => {
    const response = await request(app.getHttpServer())
      .get('/api-json')
      .expect(200);

    expect(response.body).toMatchObject({
      paths: {
        '/api/health': {
          get: {
            operationId: 'getHealth',
            responses: {
              '200': {
                content: {
                  'application/json': {
                    schema: { $ref: '#/components/schemas/HealthResponseDto' },
                  },
                },
              },
            },
          },
        },
      },
      components: {
        schemas: {
          HealthResponseDto: {
            required: ['status'],
            properties: { status: { type: 'string', enum: ['ok'] } },
          },
        },
      },
    });
  });
});
