import { randomBytes } from 'node:crypto';
import { Argon2Passwords } from '../../../../../../src/modules/identity/adapters/out/crypto/argon2-passwords.js';

describe('Argon2 password adapter', () => {
  it('hashes using independent salts and verifies the supplied password exactly', async () => {
    const passwords = new Argon2Passwords();
    const value = randomBytes(32).toString('base64url') + ' ';
    const encoded = await passwords.hash(value);
    expect(encoded.startsWith('$argon2id$')).toBe(true);
    expect(encoded === (await passwords.hash(value))).toBe(false);
    expect(await passwords.matches(value, encoded)).toBe(true);
    expect(await passwords.matches(value.trim(), encoded)).toBe(false);
    expect(await passwords.matches(value, null)).toBe(false);
  });
});
