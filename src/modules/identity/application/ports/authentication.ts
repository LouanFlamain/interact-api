import type {
  EmailTokenPurpose,
  IssuedToken,
  TokenProof,
} from '../../domain/identity.js';

export abstract class PasswordHasher {
  abstract hash(password: string): Promise<string>;
  abstract matches(password: string, hash: string | null): Promise<boolean>;
}

export abstract class OpaqueTokens {
  abstract issue(purpose: EmailTokenPurpose | 'SESSION'): IssuedToken;
  abstract parse(
    secret: string,
    purpose: EmailTokenPurpose | 'SESSION',
  ): TokenProof | null;
}

export abstract class IdentityMail {
  abstract send(to: string, purpose: EmailTokenPurpose, secret: string): void;
}

export const SESSION_TTL = Symbol('identity.sessionTtlSeconds');

export function emailTokenExpiry(purpose: EmailTokenPurpose): Date {
  const ttlMinutes = purpose === 'EMAIL_VERIFICATION' ? 24 * 60 : 30;
  return new Date(Date.now() + ttlMinutes * 60_000);
}
