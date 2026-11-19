import { Inject } from '@nestjs/common';
import { Command, CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { normalizeEmail, type Identity } from '../../../domain/identity.js';
import {
  OpaqueTokens,
  PasswordHasher,
  SESSION_TTL,
} from '../../ports/authentication.js';
import { IdentityStore, SessionStore } from '../../ports/identity-store.js';

interface LoginResult {
  user: Identity;
  cookie: string;
  expiresAt: Date;
}

export class LoginCommand extends Command<LoginResult | null> {
  constructor(
    readonly email: string,
    readonly password: string,
  ) {
    super();
  }
}

@CommandHandler(LoginCommand)
export class LoginHandler implements ICommandHandler<LoginCommand> {
  constructor(
    @Inject(IdentityStore) private readonly identities: IdentityStore,
    @Inject(SessionStore) private readonly sessions: SessionStore,
    @Inject(PasswordHasher) private readonly passwords: PasswordHasher,
    @Inject(OpaqueTokens) private readonly tokens: OpaqueTokens,
    @Inject(SESSION_TTL) private readonly ttlSeconds: number,
  ) {}

  async execute(command: LoginCommand): Promise<LoginResult | null> {
    const account = await this.identities.credentials(
      normalizeEmail(command.email),
    );
    const hash = account?.passwordHash ?? null;
    const valid = await this.passwords.matches(command.password, hash);
    if (!valid || !account || !hash) return null;
    const token = this.tokens.issue('SESSION');
    const expiresAt = new Date(Date.now() + this.ttlSeconds * 1000);
    const user = await this.sessions.create(
      account.userId,
      hash,
      token.proof,
      expiresAt,
    );
    return user && { user, cookie: token.secret, expiresAt };
  }
}
