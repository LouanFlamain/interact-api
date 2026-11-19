import { ConfigModule } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import { PrismaModule } from '../../../../src/infrastructure/persistence/prisma/prisma.module.js';
import { PrismaService } from '../../../../src/infrastructure/persistence/prisma/prisma.service.js';

describe('PrismaService', () => {
  let module: TestingModule;
  let prisma: PrismaService;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule],
    }).compile();

    await module.init();
    prisma = module.get(PrismaService);
  });

  afterAll(async () => {
    await module.close();
  });

  it('connects to PostgreSQL', async () => {
    const result = await prisma.$queryRaw<
      Array<{ value: number }>
    >`SELECT 1 AS value`;

    expect(result).toEqual([{ value: 1 }]);
  });
});
