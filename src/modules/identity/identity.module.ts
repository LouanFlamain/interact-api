import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaModule } from '../../infrastructure/persistence/prisma/prisma.module.js';
import { GetMeController } from './adapters/in/http/get-me/get-me.controller.js';
import { LoginController } from './adapters/in/http/login/login.controller.js';
import { LogoutController } from './adapters/in/http/logout/logout.controller.js';
import { PasswordResetController } from './adapters/in/http/password-reset/password-reset.controller.js';
import { RegisterController } from './adapters/in/http/register/register.controller.js';
import { SessionAuthGuard } from './adapters/in/http/session-auth.guard.js';
import { SessionCookie } from './adapters/in/http/session-cookie.js';
import { VerifyEmailController } from './adapters/in/http/verify-email/verify-email.controller.js';
import { Argon2Passwords } from './adapters/out/crypto/argon2-passwords.js';
import { RandomOpaqueTokens } from './adapters/out/crypto/opaque-tokens.js';
import { SmtpIdentityMail } from './adapters/out/mail/smtp-identity-mail.js';
import { PrismaIdentityStore } from './adapters/out/prisma/prisma-identity.store.js';
import { ConfirmEmailTokenHandler } from './application/commands/confirm-email-token/confirm-email-token.command.js';
import { LoginHandler } from './application/commands/login/login.command.js';
import { LogoutHandler } from './application/commands/logout/logout.command.js';
import { RegisterHandler } from './application/commands/register/register.command.js';
import { RequestEmailTokenHandler } from './application/commands/request-email-token/request-email-token.command.js';
import {
  IdentityMail,
  OpaqueTokens,
  PasswordHasher,
  SESSION_TTL,
} from './application/ports/authentication.js';
import {
  IdentityStore,
  SessionStore,
} from './application/ports/identity-store.js';
import { GetSessionHandler } from './application/queries/get-session/get-session.query.js';

@Module({
  imports: [PrismaModule],
  controllers: [
    RegisterController,
    VerifyEmailController,
    LoginController,
    GetMeController,
    LogoutController,
    PasswordResetController,
  ],
  providers: [
    RegisterHandler,
    RequestEmailTokenHandler,
    ConfirmEmailTokenHandler,
    LoginHandler,
    LogoutHandler,
    GetSessionHandler,
    PrismaIdentityStore,
    SessionAuthGuard,
    SessionCookie,
    { provide: IdentityStore, useExisting: PrismaIdentityStore },
    { provide: SessionStore, useExisting: PrismaIdentityStore },
    { provide: IdentityMail, useClass: SmtpIdentityMail },
    { provide: OpaqueTokens, useClass: RandomOpaqueTokens },
    { provide: PasswordHasher, useClass: Argon2Passwords },
    {
      provide: SESSION_TTL,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const value = Number(
          config.get<string>('AUTH_SESSION_TTL_SECONDS', '1209600'),
        );
        if (
          !Number.isSafeInteger(value) ||
          value < 1 ||
          value > 365 * 24 * 3600
        ) {
          throw new Error('Durée de session invalide.');
        }
        return value;
      },
    },
  ],
  exports: [SessionAuthGuard],
})
export class IdentityModule {}
