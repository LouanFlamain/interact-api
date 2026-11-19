import {
  Inject,
  Injectable,
  Logger,
  type OnApplicationShutdown,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport } from 'nodemailer';
import { IdentityMail } from '../../../application/ports/authentication.js';
import type { EmailTokenPurpose } from '../../../domain/identity.js';

@Injectable()
export class SmtpIdentityMail
  extends IdentityMail
  implements OnApplicationShutdown
{
  private readonly logger = new Logger(SmtpIdentityMail.name);
  private readonly pending = new Set<Promise<void>>();
  private readonly transport;
  private readonly origin: string;
  private readonly from: string;

  constructor(@Inject(ConfigService) config: ConfigService) {
    super();
    const production = config.get('NODE_ENV') === 'production';
    const host = production
      ? config.getOrThrow<string>('SMTP_HOST')
      : config.get<string>('SMTP_HOST', 'localhost');
    const port = Number(config.get('SMTP_PORT', production ? '587' : '1025'));
    const user = config.get<string>('SMTP_USER');
    const secure = port === 465;
    this.origin =
      config.get<string>('FRONTEND_ORIGIN') ??
      (production
        ? config.getOrThrow('FRONTEND_ORIGIN')
        : 'http://localhost:3000');
    this.from = production
      ? config.getOrThrow<string>('MAIL_FROM')
      : config.get<string>('MAIL_FROM', 'no-reply@interactive-cv.local');
    this.transport = createTransport({
      host,
      port,
      secure,
      requireTLS: production && !secure,
      auth: user
        ? { user, pass: config.getOrThrow<string>('SMTP_PASSWORD') }
        : undefined,
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 10000,
      disableFileAccess: true,
      disableUrlAccess: true,
    });
  }

  send(to: string, purpose: EmailTokenPurpose, secret: string): void {
    const verification = purpose === 'EMAIL_VERIFICATION';
    const link = new URL(
      verification ? '/auth/verify-email' : '/auth/reset-password',
      this.origin,
    );
    link.hash = new URLSearchParams({ token: secret }).toString();
    const action = verification
      ? 'Confirmer mon adresse e-mail'
      : 'Réinitialiser mon mot de passe';
    // SMTP response times must not reveal whether an address has an account.
    const delivery = this.transport
      .sendMail({
        from: this.from,
        to,
        subject: action,
        text: `${action} :\n\n${link.toString()}\n\nSi vous n’avez pas demandé cette action, ignorez ce message.`,
      })
      .then(() => undefined)
      .catch(() => {
        this.logger.warn(
          'Échec de remise du message d’authentification au serveur SMTP.',
        );
      });
    this.pending.add(delivery);
    void delivery.finally(() => this.pending.delete(delivery));
  }

  async onApplicationShutdown(): Promise<void> {
    await Promise.all(this.pending);
    this.transport.close();
  }
}
