import 'dotenv/config';
import { Controller, Get, type INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { randomBytes, randomUUID } from 'node:crypto';
import type { Server } from 'node:http';
import request from 'supertest';
import { vi } from 'vitest';
import { configureHttp } from '../../../../../../src/configure-http.js';
import { PrismaService } from '../../../../../../src/infrastructure/persistence/prisma/prisma.service.js';
import { RequireSystemRole } from '../../../../../../src/modules/identity/adapters/in/http/session-auth.guard.js';
import { IdentityMail } from '../../../../../../src/modules/identity/application/ports/authentication.js';
import type { EmailTokenPurpose } from '../../../../../../src/modules/identity/domain/identity.js';

@Controller('test/identity/admin')
class TestAdminController {
  @Get()
  @RequireSystemRole('ADMIN')
  admin(): { authorized: boolean } {
    return { authorized: true };
  }
}

describe('Authentification locale', () => {
  let app: INestApplication<Server>;
  let db: PrismaService;
  const accounts = new Set<string>();
  const messages: { to: string; purpose: EmailTokenPurpose; secret: string }[] =
    [];
  const origin = process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000';
  const prefix = '/api/auth';

  function nextEmail(): string {
    const email = `e2e-${randomUUID()}@example.test`;
    accounts.add(email);
    return email;
  }
  const post = (path: string) =>
    request(app.getHttpServer())
      .post(prefix + path)
      .set('Origin', origin);
  const get = (path: string) =>
    request(app.getHttpServer()).get(path).set('Origin', origin);
  const makePassword = () => randomBytes(32).toString('base64url');
  function lastToken(email: string, purpose: EmailTokenPurpose): string {
    const target = messages
      .filter((m) => m.to === email && m.purpose === purpose)
      .at(-1);
    if (!target)
      throw new Error('Le transport de test n’a pas reçu le message attendu.');
    return target.secret;
  }
  function cookieFrom(headers: Record<string, unknown>): {
    header: string;
    cookie: string;
  } {
    const values = headers['set-cookie'];
    if (!Array.isArray(values) || typeof values[0] !== 'string')
      throw new Error('Cookie de session attendu.');
    return { header: values[0], cookie: values[0].split(';')[0] };
  }

  beforeAll(async () => {
    const url = process.env.IDENTITY_TEST_DATABASE_URL;
    if (
      !url ||
      !/test/i.test(new URL(url).pathname) ||
      (process.env.DATABASE_URL &&
        new URL(url).pathname === new URL(process.env.DATABASE_URL).pathname)
    ) {
      throw new Error(
        'Configurer IDENTITY_TEST_DATABASE_URL sur une base de test dédiée et migrée.',
      );
    }
    vi.stubEnv('DATABASE_URL', url);
    const { AppModule } = await import('../../../../../../src/app.module.js');
    const fixture = await Test.createTestingModule({
      imports: [AppModule],
      controllers: [TestAdminController],
    })
      .overrideProvider(IdentityMail)
      .useValue({
        send(to: string, purpose: EmailTokenPurpose, secret: string) {
          messages.push({ to, purpose, secret });
        },
      } satisfies IdentityMail)
      .compile();
    app = fixture.createNestApplication();
    app.setGlobalPrefix('api');
    configureHttp(app, app.get(ConfigService));
    await app.init();
    db = app.get(PrismaService);
  });

  afterAll(async () => {
    try {
      if (db && accounts.size) {
        const user = { email: { in: [...accounts] } };
        await db.$transaction([
          db.authSession.deleteMany({ where: { user } }),
          db.authToken.deleteMany({ where: { user } }),
          db.passwordCredential.deleteMany({ where: { user } }),
          db.user.deleteMany({ where: user }),
        ]);
      }
    } finally {
      try {
        await app?.close();
      } finally {
        vi.unstubAllEnvs();
      }
    }
  });

  it('rejects invalid input, client-selected roles, and requests from another origin', async () => {
    const email = nextEmail();
    const password = makePassword();
    await post('/register').send({ email: 'invalid', password }).expect(400);
    await post('/register').send({ email, password: 'short' }).expect(400);
    await post('/register')
      .send({ email, password, systemRole: 'ADMIN' })
      .expect(400);
    await post('/register')
      .set('Origin', 'https://other.invalid')
      .send({ email, password })
      .expect(403);
    expect(await db.user.count({ where: { email } })).toBe(0);
    await get(prefix + '/me').expect(401);
    await get('/api/test/identity/admin').expect(401);
  });

  it('verifies the mailbox, rotates the pending credential, authorizes the current role, and revokes on logout', async () => {
    const email = nextEmail();
    const initial = makePassword();
    const password = makePassword();
    const [first, second] = await Promise.all([
      post('/register').send({ email, password: initial }),
      post('/register').send({ email: email.toUpperCase(), password: initial }),
    ]);
    expect([first.status, second.status]).toEqual([202, 202]);
    expect([first.text, second.text]).toEqual(['', '']);
    expect(messages.filter((m) => m.to === email)).toHaveLength(1);
    const originalToken = lastToken(email, 'EMAIL_VERIFICATION');
    await post('/login').send({ email, password: initial }).expect(401);
    await post('/verification/resend').send({ email }).expect(202);
    const currentToken = lastToken(email, 'EMAIL_VERIFICATION');
    const confirmations = await Promise.all([
      post('/verify-email').send({ token: currentToken, password }),
      post('/verify-email').send({ token: currentToken, password }),
    ]);
    expect(
      confirmations.map((v) => v.status).sort((left, right) => left - right),
    ).toEqual([204, 400]);
    await post('/verify-email')
      .send({ token: originalToken, password })
      .expect(400);
    const refused = await post('/login')
      .send({ email, password: initial })
      .expect(401);
    const unknown = await post('/login')
      .send({ email: nextEmail(), password })
      .expect(401);
    expect(unknown.body).toEqual(refused.body);
    const logged = await post('/login').send({ email, password }).expect(200);
    expect(Object.keys(logged.body).sort()).toEqual([
      'email',
      'emailVerified',
      'id',
      'systemRole',
    ]);
    expect(logged.body).toMatchObject({
      email,
      emailVerified: true,
      systemRole: 'USER',
    });
    const { header, cookie } = cookieFrom(logged.header);
    expect(header.includes('HttpOnly')).toBe(true);
    expect(header.includes('SameSite=Lax')).toBe(true);
    expect(header.includes('Path=/')).toBe(true);
    expect(header.toLowerCase().includes('domain=')).toBe(false);
    await get(prefix + '/me')
      .set('Cookie', cookie)
      .expect(200)
      .expect(logged.body);
    await get('/api/test/identity/admin').set('Cookie', cookie).expect(403);
    await db.user.update({ where: { email }, data: { systemRole: 'ADMIN' } });
    await get('/api/test/identity/admin').set('Cookie', cookie).expect(200);
    const session = await db.authSession.findFirstOrThrow({
      where: { user: { email } },
      select: { id: true, verifierHash: true },
    });
    expect(cookie.includes(session.verifierHash)).toBe(false);
    await get(prefix + '/me')
      .set('Cookie', cookie.split('.')[0])
      .expect(401);
    await post('/logout').set('Cookie', cookie).expect(204);
    await get(prefix + '/me')
      .set('Cookie', cookie)
      .expect(401);
    await post('/logout').set('Cookie', cookie).expect(204);
  });

  it('resets a verified local password once, honors token purpose and expiry, and revokes all sessions', async () => {
    const email = nextEmail();
    const password = makePassword();
    const newPassword = makePassword();
    await post('/register').send({ email, password }).expect(202);
    const verify = lastToken(email, 'EMAIL_VERIFICATION');
    await post('/password/reset')
      .send({ token: verify, newPassword })
      .expect(400);
    await post('/verify-email').send({ token: verify, password }).expect(204);
    const a = cookieFrom(
      (await post('/login').send({ email, password }).expect(200)).header,
    ).cookie;
    const b = cookieFrom(
      (await post('/login').send({ email, password }).expect(200)).header,
    ).cookie;
    expect(a === b).toBe(false);
    const unknown = nextEmail();
    await post('/password/forgot').send({ email: unknown }).expect(202);
    expect(messages.some((m) => m.to === unknown)).toBe(false);
    await post('/password/forgot').send({ email }).expect(202);
    const expired = lastToken(email, 'PASSWORD_RESET');
    await db.authToken.updateMany({
      where: { user: { email }, purpose: 'PASSWORD_RESET' },
      data: { expiresAt: new Date(0) },
    });
    await post('/password/reset')
      .send({ token: expired, newPassword })
      .expect(400);
    await post('/password/forgot').send({ email }).expect(202);
    const valid = lastToken(email, 'PASSWORD_RESET');
    await post('/verify-email')
      .send({ token: valid, password: newPassword })
      .expect(400);
    await post('/password/reset')
      .send({ token: valid, newPassword })
      .expect(204);
    await post('/password/reset')
      .send({ token: valid, newPassword })
      .expect(400);
    await get(prefix + '/me')
      .set('Cookie', a)
      .expect(401);
    await get(prefix + '/me')
      .set('Cookie', b)
      .expect(401);
    await post('/login').send({ email, password }).expect(401);
    const current = cookieFrom(
      (await post('/login').send({ email, password: newPassword }).expect(200))
        .header,
    ).cookie;
    await db.authSession.updateMany({
      where: { user: { email } },
      data: { expiresAt: new Date(0) },
    });
    await get(prefix + '/me')
      .set('Cookie', current)
      .expect(401);
  });

  it('rate limits verification-email resend requests', async () => {
    const email = nextEmail();
    await post('/register')
      .send({ email, password: makePassword() })
      .expect(202);

    const statuses: number[] = [];
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const response = await post('/verification/resend').send({ email });
      statuses.push(response.status);
    }

    expect(statuses).toEqual([202, 202, 202, 202, 429]);
  });
});
