import { ConfigService } from '@nestjs/config';
import { describe, expect, it } from 'vitest';
import { sessionCookieName } from '../../../../../../src/modules/identity/adapters/in/http/session-cookie.js';

describe('sessionCookieName', () => {
  it('uses the host-prefixed production cookie name', () => {
    const config = new ConfigService({
      NODE_ENV: 'production',
      AUTH_COOKIE_NAME: 'configured-development-name',
    });

    expect(sessionCookieName(config)).toBe('__Host-session');
  });

  it('uses the configured development cookie name', () => {
    const config = new ConfigService({
      NODE_ENV: 'development',
      AUTH_COOKIE_NAME: 'interactive_cv_session',
    });

    expect(sessionCookieName(config)).toBe('interactive_cv_session');
  });
});
