import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CookieOptions, Request, Response } from 'express';

export function sessionCookieName(config: ConfigService): string {
  return config.get<string>('NODE_ENV') === 'production'
    ? '__Host-session'
    : config.get<string>('AUTH_COOKIE_NAME', 'interactive_cv_session');
}

@Injectable()
export class SessionCookie {
  private readonly name: string;
  private readonly options: CookieOptions;

  constructor(@Inject(ConfigService) config: ConfigService) {
    const production = config.get<string>('NODE_ENV') === 'production';
    this.name = sessionCookieName(config);
    this.options = {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure:
        production ||
        this.name.startsWith('__Host-') ||
        config.get<string>('AUTH_COOKIE_SECURE') === 'true',
    };
  }

  read(request: Request): string {
    const cookies = request.cookies as Record<string, unknown> | undefined;
    const cookie = cookies?.[this.name];
    return typeof cookie === 'string' ? cookie : '';
  }

  write(response: Response, secret: string, expires: Date): void {
    response.cookie(this.name, secret, { ...this.options, expires });
  }

  clear(response: Response): void {
    response.clearCookie(this.name, this.options);
  }
}
