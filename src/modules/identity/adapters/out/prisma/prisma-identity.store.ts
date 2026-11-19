import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Prisma } from '../../../../../infrastructure/persistence/prisma/generated/client.js';
import { PrismaService } from '../../../../../infrastructure/persistence/prisma/prisma.service.js';
import {
  IdentityStore,
  SessionStore,
} from '../../../application/ports/identity-store.js';
import type {
  EmailTokenPurpose,
  Identity,
  SystemRole,
  TokenProof,
} from '../../../domain/identity.js';

const userFields = {
  id: true,
  email: true,
  systemRole: true,
  emailVerifiedAt: true,
} as const;

function publicIdentity(user: {
  id: string;
  email: string;
  systemRole: SystemRole;
  emailVerifiedAt: Date | null;
}): Identity {
  return {
    id: user.id,
    email: user.email,
    systemRole: user.systemRole,
    emailVerified: user.emailVerifiedAt !== null,
  };
}

// Session issuance and changes of credentials take locks in the same order.
// A login checked just before a reset must not create a session after revocation.
async function lockUser(
  tx: Prisma.TransactionClient,
  userId: string,
): Promise<void> {
  await tx.$queryRaw`SELECT id FROM users WHERE id = ${userId}::uuid FOR UPDATE`;
}

@Injectable()
export class PrismaIdentityStore implements IdentityStore, SessionStore {
  constructor(@Inject(PrismaService) private readonly db: PrismaService) {}

  register(
    email: string,
    passwordHash: string,
    token: TokenProof,
    expiresAt: Date,
  ): Promise<boolean> {
    return this.db.$transaction(async (tx) => {
      const userId = randomUUID();
      const created = await tx.user.createMany({
        data: [{ id: userId, email, systemRole: 'USER' }],
        skipDuplicates: true,
      });
      if (created.count === 0) return false;
      await tx.passwordCredential.create({ data: { userId, passwordHash } });
      await tx.authToken.create({
        data: { ...token, userId, purpose: 'EMAIL_VERIFICATION', expiresAt },
      });
      return true;
    });
  }

  async credentials(email: string) {
    const user = await this.db.user.findUnique({
      where: { email },
      select: {
        id: true,
        passwordCredential: { select: { passwordHash: true } },
      },
    });
    return (
      user && {
        userId: user.id,
        passwordHash: user.passwordCredential?.passwordHash ?? null,
      }
    );
  }

  issueEmailToken(
    email: string,
    purpose: EmailTokenPurpose,
    token: TokenProof,
    expiresAt: Date,
  ): Promise<boolean> {
    return this.db.$transaction(async (tx) => {
      const [locked] = await tx.$queryRaw<
        { id: string }[]
      >`SELECT id FROM users WHERE email = ${email} FOR UPDATE`;
      if (!locked) return false;
      const user = await tx.user.findFirst({
        where: {
          id: locked.id,
          emailVerifiedAt:
            purpose === 'EMAIL_VERIFICATION' ? null : { not: null },
          passwordCredential: { isNot: null },
        },
        select: { id: true },
      });
      if (!user) return false;
      await tx.authToken.create({
        data: { ...token, userId: user.id, purpose, expiresAt },
      });
      return true;
    });
  }

  async canConsume(
    purpose: EmailTokenPurpose,
    token: TokenProof,
  ): Promise<boolean> {
    const valid = await this.db.authToken.findFirst({
      where: {
        ...token,
        purpose,
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
      select: { id: true },
    });
    return valid !== null;
  }

  finishEmailToken(
    purpose: EmailTokenPurpose,
    token: TokenProof,
    passwordHash: string,
  ): Promise<boolean> {
    return this.db.$transaction(async (tx) => {
      const candidate = await tx.authToken.findFirst({
        where: { ...token, purpose, consumedAt: null },
        select: { userId: true },
      });
      if (!candidate) return false;
      const { userId } = candidate;
      await lockUser(tx, userId);
      const now = new Date();
      const claimed = await tx.authToken.updateMany({
        where: { ...token, purpose, consumedAt: null, expiresAt: { gt: now } },
        data: { consumedAt: now },
      });
      if (claimed.count !== 1) return false;
      await tx.passwordCredential.update({
        where: { userId },
        data: { passwordHash },
      });
      if (purpose === 'EMAIL_VERIFICATION') {
        await tx.user.update({
          where: { id: userId },
          data: { emailVerifiedAt: now },
        });
      }
      await tx.authSession.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: now },
      });
      await tx.authToken.updateMany({
        where: { userId, purpose, consumedAt: null },
        data: { consumedAt: now },
      });
      return true;
    });
  }

  create(
    userId: string,
    expectedHash: string,
    token: TokenProof,
    expiresAt: Date,
  ): Promise<Identity | null> {
    return this.db.$transaction(async (tx) => {
      await lockUser(tx, userId);
      const user = await tx.user.findFirst({
        where: {
          id: userId,
          emailVerifiedAt: { not: null },
          passwordCredential: { is: { passwordHash: expectedHash } },
        },
        select: userFields,
      });
      if (!user) return null;
      await tx.authSession.create({ data: { ...token, userId, expiresAt } });
      return publicIdentity(user);
    });
  }

  async identify(token: TokenProof): Promise<Identity | null> {
    const session = await this.db.authSession.findFirst({
      where: {
        ...token,
        revokedAt: null,
        expiresAt: { gt: new Date() },
        user: { emailVerifiedAt: { not: null } },
      },
      select: { user: { select: userFields } },
    });
    return session ? publicIdentity(session.user) : null;
  }

  async revoke(token: TokenProof): Promise<void> {
    await this.db.authSession.updateMany({
      where: { ...token, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
