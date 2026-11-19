import type {
  EmailTokenPurpose,
  Identity,
  TokenProof,
} from '../../domain/identity.js';

export abstract class IdentityStore {
  abstract register(
    email: string,
    passwordHash: string,
    token: TokenProof,
    expiresAt: Date,
  ): Promise<boolean>;
  abstract credentials(
    email: string,
  ): Promise<{ userId: string; passwordHash: string | null } | null>;
  abstract issueEmailToken(
    email: string,
    purpose: EmailTokenPurpose,
    token: TokenProof,
    expiresAt: Date,
  ): Promise<boolean>;
  abstract canConsume(
    purpose: EmailTokenPurpose,
    token: TokenProof,
  ): Promise<boolean>;
  abstract finishEmailToken(
    purpose: EmailTokenPurpose,
    token: TokenProof,
    passwordHash: string,
  ): Promise<boolean>;
}

export abstract class SessionStore {
  abstract create(
    userId: string,
    expectedHash: string,
    token: TokenProof,
    expiresAt: Date,
  ): Promise<Identity | null>;
  abstract identify(token: TokenProof): Promise<Identity | null>;
  abstract revoke(token: TokenProof): Promise<void>;
}
