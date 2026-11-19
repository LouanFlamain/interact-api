import { Injectable } from '@nestjs/common';
import { argon2id, hash, verify } from 'argon2';
import { randomBytes } from 'node:crypto';
import { PasswordHasher } from '../../../application/ports/authentication.js';

@Injectable()
export class Argon2Passwords extends PasswordHasher {
  private readonly dummy = this.hash(randomBytes(32).toString('hex'));

  hash(password: string): Promise<string> {
    return hash(password, {
      type: argon2id,
      memoryCost: 19456,
      timeCost: 2,
      parallelism: 1,
    });
  }

  async matches(password: string, encoded: string | null): Promise<boolean> {
    const matches = await verify(encoded ?? (await this.dummy), password);
    return encoded !== null && matches;
  }
}
