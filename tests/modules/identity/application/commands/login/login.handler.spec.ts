import { vi } from 'vitest';
import {
  LoginCommand,
  LoginHandler,
} from '../../../../../../src/modules/identity/application/commands/login/login.command.js';
import type {
  IdentityStore,
  SessionStore,
} from '../../../../../../src/modules/identity/application/ports/identity-store.js';
import type {
  OpaqueTokens,
  PasswordHasher,
} from '../../../../../../src/modules/identity/application/ports/authentication.js';

function setup() {
  const identities = {
    register: vi.fn(),
    credentials: vi.fn(),
    issueEmailToken: vi.fn(),
    canConsume: vi.fn(),
    finishEmailToken: vi.fn(),
  } satisfies IdentityStore;
  const sessions = {
    create: vi.fn(),
    identify: vi.fn(),
    revoke: vi.fn(),
  } satisfies SessionStore;
  const passwords = {
    hash: vi.fn(),
    matches: vi.fn(),
  } satisfies PasswordHasher;
  const tokens = { issue: vi.fn(), parse: vi.fn() } satisfies OpaqueTokens;
  const handler = new LoginHandler(identities, sessions, passwords, tokens, 60);
  return { identities, sessions, passwords, tokens, handler };
}

describe('LoginHandler', () => {
  it('normalizes the address and performs password verification for an unknown identity', async () => {
    const { identities, sessions, passwords, handler } = setup();
    identities.credentials.mockResolvedValue(null);
    passwords.matches.mockResolvedValue(false);
    expect(
      await handler.execute(
        new LoginCommand('  Example@EXAMPLE.TEST ', 'example input'),
      ),
    ).toBeNull();
    expect(identities.credentials).toHaveBeenCalledWith('example@example.test');
    expect(passwords.matches).toHaveBeenCalledWith('example input', null);
    expect(sessions.create).not.toHaveBeenCalled();
  });

  it('does not issue a cookie when the current credential cannot open a session', async () => {
    const { identities, sessions, passwords, tokens, handler } = setup();
    identities.credentials.mockResolvedValue({
      userId: 'user',
      passwordHash: 'stored',
    });
    passwords.matches.mockResolvedValue(true);
    tokens.issue.mockReturnValue({
      secret: 'test',
      proof: { id: 'selector', verifierHash: 'hash' },
    });
    sessions.create.mockResolvedValue(null);
    expect(
      await handler.execute(
        new LoginCommand('user@example.test', 'example input'),
      ),
    ).toBeNull();
    expect(sessions.create).toHaveBeenCalledOnce();
  });
});
