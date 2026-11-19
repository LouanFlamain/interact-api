import { Inject } from '@nestjs/common';
import { Command, CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import {
  normalizeEmail,
  type EmailTokenPurpose,
} from '../../../domain/identity.js';
import {
  emailTokenExpiry,
  IdentityMail,
  OpaqueTokens,
} from '../../ports/authentication.js';
import { IdentityStore } from '../../ports/identity-store.js';

export class RequestEmailTokenCommand extends Command<void> {
  constructor(
    readonly email: string,
    readonly purpose: EmailTokenPurpose,
  ) {
    super();
  }
}

@CommandHandler(RequestEmailTokenCommand)
export class RequestEmailTokenHandler implements ICommandHandler<RequestEmailTokenCommand> {
  constructor(
    @Inject(IdentityStore) private readonly identities: IdentityStore,
    @Inject(OpaqueTokens) private readonly tokens: OpaqueTokens,
    @Inject(IdentityMail) private readonly mail: IdentityMail,
  ) {}

  async execute(command: RequestEmailTokenCommand): Promise<void> {
    const email = normalizeEmail(command.email);
    const token = this.tokens.issue(command.purpose);
    const created = await this.identities.issueEmailToken(
      email,
      command.purpose,
      token.proof,
      emailTokenExpiry(command.purpose),
    );
    if (created) this.mail.send(email, command.purpose, token.secret);
  }
}
