import { Inject } from '@nestjs/common';
import { Query, QueryHandler, type IQueryHandler } from '@nestjs/cqrs';
import type { Identity } from '../../../domain/identity.js';
import { OpaqueTokens } from '../../ports/authentication.js';
import { SessionStore } from '../../ports/identity-store.js';

export class GetSessionQuery extends Query<Identity | null> {
  constructor(readonly cookie: string) {
    super();
  }
}

@QueryHandler(GetSessionQuery)
export class GetSessionHandler implements IQueryHandler<GetSessionQuery> {
  constructor(
    @Inject(SessionStore) private readonly sessions: SessionStore,
    @Inject(OpaqueTokens) private readonly tokens: OpaqueTokens,
  ) {}

  async execute(query: GetSessionQuery): Promise<Identity | null> {
    const proof = this.tokens.parse(query.cookie, 'SESSION');
    return proof ? this.sessions.identify(proof) : null;
  }
}
