import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'node:crypto';
import { RandomOpaqueTokens } from '../../../../../../src/modules/identity/adapters/out/crypto/opaque-tokens.js';

describe('Opaque identity tokens', () => {
  const codec = new RandomOpaqueTokens(
    new ConfigService({ AUTH_SESSION_SECRET: randomBytes(32).toString('hex') }),
  );

  it('creates independently random secrets and stores a purpose-bound verifier', () => {
    const token = codec.issue('SESSION');
    const proof = codec.parse(token.secret, 'SESSION');
    expect(token.secret === codec.issue('SESSION').secret).toBe(false);
    expect(proof?.verifierHash === token.proof.verifierHash).toBe(true);
    expect(
      codec.parse(token.secret, 'PASSWORD_RESET')?.verifierHash ===
        proof?.verifierHash,
    ).toBe(false);
    expect(token.secret.includes(token.proof.verifierHash)).toBe(false);
  });

  it('requires both a valid selector and a full secret', () => {
    const token = codec.issue('EMAIL_VERIFICATION');
    expect(codec.parse(token.proof.id, 'EMAIL_VERIFICATION')).toBeNull();
    expect(codec.parse(token.secret + 'x', 'EMAIL_VERIFICATION')).toBeNull();
    expect(codec.parse('', 'EMAIL_VERIFICATION')).toBeNull();
  });
});
