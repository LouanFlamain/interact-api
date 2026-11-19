import {
  type CanActivate,
  createParamDecorator,
  type ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  SetMetadata,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { QueryBus } from '@nestjs/cqrs';
import type { Request } from 'express';
import { GetSessionQuery } from '../../../application/queries/get-session/get-session.query.js';
import type { Identity, SystemRole } from '../../../domain/identity.js';
import { SessionCookie } from './session-cookie.js';

const IS_PUBLIC = Symbol('identity.public');
const SYSTEM_ROLE = Symbol('identity.requiredRole');
export const Public = () => SetMetadata(IS_PUBLIC, true);
export const RequireSystemRole = (role: SystemRole) =>
  SetMetadata(SYSTEM_ROLE, role);
interface AuthenticatedRequest extends Request {
  identity?: Identity;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): Identity => {
    const user = context
      .switchToHttp()
      .getRequest<AuthenticatedRequest>().identity;
    if (!user) throw new UnauthorizedException();
    return user;
  },
);

@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(
    @Inject(Reflector) private readonly reflector: Reflector,
    @Inject(QueryBus) private readonly queries: QueryBus,
    @Inject(SessionCookie) private readonly cookies: SessionCookie,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (context.getType() !== 'http') return false;
    const targets = [context.getHandler(), context.getClass()];
    const role = this.reflector.getAllAndOverride<SystemRole>(
      SYSTEM_ROLE,
      targets,
    );
    if (!role && this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, targets))
      return true;
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = await this.queries.execute(
      new GetSessionQuery(this.cookies.read(request)),
    );
    if (!user) throw new UnauthorizedException();
    if (role && user.systemRole !== role) throw new ForbiddenException();
    request.identity = user;
    return true;
  }
}
