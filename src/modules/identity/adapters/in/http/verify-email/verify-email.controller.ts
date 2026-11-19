import {
  BadRequestException,
  Body,
  Controller,
  Header,
  HttpCode,
  Inject,
  Post,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Throttle } from '@nestjs/throttler';
import {
  ApiAcceptedResponse,
  ApiBadRequestResponse,
  ApiNoContentResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ConfirmEmailTokenCommand } from '../../../../application/commands/confirm-email-token/confirm-email-token.command.js';
import { RequestEmailTokenCommand } from '../../../../application/commands/request-email-token/request-email-token.command.js';
import { EmailRequestDto, VerifyEmailDto } from '../auth.dto.js';
import { Public } from '../session-auth.guard.js';

@ApiTags('Authentification')
@Public()
@Controller('auth')
export class VerifyEmailController {
  constructor(@Inject(CommandBus) private readonly commands: CommandBus) {}

  @Post('verification/resend')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(202)
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ operationId: 'resendVerificationEmail' })
  @ApiAcceptedResponse({
    description: 'Si une vérification est attendue, un lien est envoyé.',
  })
  @ApiBadRequestResponse({ description: 'Champs invalides.' })
  resend(@Body() dto: EmailRequestDto): Promise<void> {
    return this.commands.execute(
      new RequestEmailTokenCommand(dto.email, 'EMAIL_VERIFICATION'),
    );
  }

  @Post('verify-email')
  @HttpCode(204)
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ operationId: 'verifyEmail' })
  @ApiNoContentResponse({
    description:
      'Adresse confirmée et mot de passe enregistré. La connexion est désormais disponible.',
  })
  @ApiBadRequestResponse({
    description: 'Champs invalides ou lien expiré, invalide ou déjà utilisé.',
  })
  async verify(@Body() dto: VerifyEmailDto): Promise<void> {
    if (
      !(await this.commands.execute(
        new ConfirmEmailTokenCommand(
          'EMAIL_VERIFICATION',
          dto.token,
          dto.password,
        ),
      ))
    ) {
      throw new BadRequestException('Lien invalide ou expiré.');
    }
  }
}
