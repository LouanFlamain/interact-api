import { Inject } from '@nestjs/common';
import { Command, CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { OpaqueTokens } from '../../ports/authentication.js';
import { SessionStore } from '../../ports/identity-store.js';

export class LogoutCommand extends Command<void> {
  constructor(readonly cookie: string) {
    super();
  }
}

@CommandHandler(LogoutCommand)
export class LogoutHandler implements ICommandHandler<LogoutCommand> {
  constructor(
    @Inject(SessionStore) private readonly sessions: SessionStore,
    @Inject(OpaqueTokens) private readonly tokens: OpaqueTokens,
  ) {}

  async execute(command: LogoutCommand): Promise<void> {
    const proof = this.tokens.parse(command.cookie, 'SESSION');
    if (proof) await this.sessions.revoke(proof);
  }
}
