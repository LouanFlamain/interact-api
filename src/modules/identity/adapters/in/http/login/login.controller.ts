import {
  Body,
  Controller,
  Header,
  HttpCode,
  Inject,
  Post,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Throttle } from '@nestjs/throttler';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { LoginCommand } from '../../../../application/commands/login/login.command.js';
import { CurrentUserDto, LoginRequestDto } from '../auth.dto.js';
import { Public } from '../session-auth.guard.js';
import { SessionCookie } from '../session-cookie.js';

@ApiTags('Authentification')
@Public()
@Controller('auth')
export class LoginController {
  constructor(
    @Inject(CommandBus) private readonly commands: CommandBus,
    @Inject(SessionCookie) private readonly cookies: SessionCookie,
  ) {}

  @Post('login')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(200)
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ operationId: 'login' })
  @ApiOkResponse({
    type: CurrentUserDto,
    description: 'Session ouverte. Le navigateur conserve le cookie HttpOnly.',
  })
  @ApiBadRequestResponse({ description: 'Champs invalides.' })
  @ApiUnauthorizedResponse({ description: 'Connexion refusée.' })
  async login(
    @Body() dto: LoginRequestDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<CurrentUserDto> {
    const result = await this.commands.execute(
      new LoginCommand(dto.email, dto.password),
    );
    if (!result) throw new UnauthorizedException('Connexion refusée.');
    this.cookies.write(response, result.cookie, result.expiresAt);
    return result.user;
  }
}
