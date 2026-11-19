import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, randomBytes, randomUUID } from 'node:crypto';
import { OpaqueTokens } from '../../../application/ports/authentication.js';
import type {
  EmailTokenPurpose,
  IssuedToken,
  TokenProof,
} from '../../../domain/identity.js';

type Purpose = EmailTokenPurpose | 'SESSION';
const TOKEN =
  /^([a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12})\.[A-Za-z0-9_-]{43}$/;

@Injectable()
export class RandomOpaqueTokens extends OpaqueTokens {
  private readonly key: string;

  constructor(@Inject(ConfigService) config: ConfigService) {
    super();
    this.key = config.getOrThrow<string>('AUTH_SESSION_SECRET');
    if (Buffer.byteLength(this.key) < 32) {
      throw new Error('AUTH_SESSION_SECRET doit contenir au moins 32 octets.');
    }
  }

  issue(purpose: Purpose): IssuedToken {
    const id = randomUUID();
    const secret = `${id}.${randomBytes(32).toString('base64url')}`;
    return {
      secret,
      proof: { id, verifierHash: this.digest(secret, purpose) },
    };
  }

  parse(secret: string, purpose: Purpose): TokenProof | null {
    if (secret.length !== 80) return null;
    const match = TOKEN.exec(secret);
    return match
      ? { id: match[1], verifierHash: this.digest(secret, purpose) }
      : null;
  }

  private digest(secret: string, purpose: Purpose): string {
    return createHmac('sha256', this.key)
      .update(purpose)
      .update(':')
      .update(secret)
      .digest('hex');
  }
}
