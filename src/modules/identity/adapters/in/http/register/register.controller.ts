import {
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
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { RegisterCommand } from '../../../../application/commands/register/register.command.js';
import { RegisterRequestDto } from '../auth.dto.js';
import { Public } from '../session-auth.guard.js';

@ApiTags('Authentification')
@Public()
@Controller('auth')
export class RegisterController {
  constructor(@Inject(CommandBus) private readonly commands: CommandBus) {}

  @Post('register')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(202)
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    operationId: 'register',
    summary: 'Demander une inscription locale',
  })
  @ApiAcceptedResponse({
    description:
      'Demande prise en compte. Un lien est envoyé si une nouvelle inscription est possible.',
  })
  @ApiBadRequestResponse({ description: 'Champs invalides.' })
  register(@Body() dto: RegisterRequestDto): Promise<void> {
    return this.commands.execute(new RegisterCommand(dto.email, dto.password));
  }
}
