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
import { EmailRequestDto, ResetPasswordDto } from '../auth.dto.js';
import { Public } from '../session-auth.guard.js';

@ApiTags('Authentification')
@Public()
@Controller('auth/password')
export class PasswordResetController {
  constructor(@Inject(CommandBus) private readonly commands: CommandBus) {}

  @Post('forgot')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(202)
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ operationId: 'requestPasswordReset' })
  @ApiAcceptedResponse({
    description: 'Si le compte est éligible, un lien est envoyé.',
  })
  @ApiBadRequestResponse({ description: 'Champs invalides.' })
  requestReset(@Body() dto: EmailRequestDto): Promise<void> {
    return this.commands.execute(
      new RequestEmailTokenCommand(dto.email, 'PASSWORD_RESET'),
    );
  }

  @Post('reset')
  @HttpCode(204)
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ operationId: 'resetPassword' })
  @ApiNoContentResponse({
    description: 'Mot de passe remplacé et sessions révoquées.',
  })
  @ApiBadRequestResponse({
    description: 'Champs invalides ou lien expiré, invalide ou déjà utilisé.',
  })
  async reset(@Body() dto: ResetPasswordDto): Promise<void> {
    if (
      !(await this.commands.execute(
        new ConfirmEmailTokenCommand(
          'PASSWORD_RESET',
          dto.token,
          dto.newPassword,
        ),
      ))
    ) {
      throw new BadRequestException('Lien invalide ou expiré.');
    }
  }
}
