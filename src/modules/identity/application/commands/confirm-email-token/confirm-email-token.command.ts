import { Inject } from '@nestjs/common';
import { Command, CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import type { EmailTokenPurpose } from '../../../domain/identity.js';
import { OpaqueTokens, PasswordHasher } from '../../ports/authentication.js';
import { IdentityStore } from '../../ports/identity-store.js';

export class ConfirmEmailTokenCommand extends Command<boolean> {
  constructor(
    readonly purpose: EmailTokenPurpose,
    readonly token: string,
    readonly password: string,
  ) {
    super();
  }
}

@CommandHandler(ConfirmEmailTokenCommand)
export class ConfirmEmailTokenHandler implements ICommandHandler<ConfirmEmailTokenCommand> {
  constructor(
    @Inject(IdentityStore) private readonly identities: IdentityStore,
    @Inject(OpaqueTokens) private readonly tokens: OpaqueTokens,
    @Inject(PasswordHasher) private readonly passwords: PasswordHasher,
  ) {}

  async execute(command: ConfirmEmailTokenCommand): Promise<boolean> {
    const proof = this.tokens.parse(command.token, command.purpose);
    if (!proof || !(await this.identities.canConsume(command.purpose, proof)))
      return false;
    const hash = await this.passwords.hash(command.password);
    return this.identities.finishEmailToken(command.purpose, proof, hash);
  }
}
