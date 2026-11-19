import { Inject } from '@nestjs/common';
import { Command, CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { normalizeEmail } from '../../../domain/identity.js';
import {
  emailTokenExpiry,
  IdentityMail,
  OpaqueTokens,
  PasswordHasher,
} from '../../ports/authentication.js';
import { IdentityStore } from '../../ports/identity-store.js';

export class RegisterCommand extends Command<void> {
  constructor(
    readonly email: string,
    readonly password: string,
  ) {
    super();
  }
}

@CommandHandler(RegisterCommand)
export class RegisterHandler implements ICommandHandler<RegisterCommand> {
  constructor(
    @Inject(IdentityStore) private readonly identities: IdentityStore,
    @Inject(PasswordHasher) private readonly passwords: PasswordHasher,
    @Inject(OpaqueTokens) private readonly tokens: OpaqueTokens,
    @Inject(IdentityMail) private readonly mail: IdentityMail,
  ) {}

  async execute(command: RegisterCommand): Promise<void> {
    const email = normalizeEmail(command.email);
    const passwordHash = await this.passwords.hash(command.password);
    const token = this.tokens.issue('EMAIL_VERIFICATION');
    const created = await this.identities.register(
      email,
      passwordHash,
      token.proof,
      emailTokenExpiry('EMAIL_VERIFICATION'),
    );
    if (created) this.mail.send(email, 'EMAIL_VERIFICATION', token.secret);
  }
}
