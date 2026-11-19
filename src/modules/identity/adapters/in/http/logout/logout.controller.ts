import {
  Controller,
  Header,
  HttpCode,
  Inject,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiNoContentResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { LogoutCommand } from '../../../../application/commands/logout/logout.command.js';
import { Public } from '../session-auth.guard.js';
import { SessionCookie } from '../session-cookie.js';

@ApiTags('Authentification')
@Public()
@Controller('auth')
export class LogoutController {
  constructor(
    @Inject(CommandBus) private readonly commands: CommandBus,
    @Inject(SessionCookie) private readonly cookies: SessionCookie,
  ) {}

  @Post('logout')
  @HttpCode(204)
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ operationId: 'logout' })
  @ApiNoContentResponse({
    description: 'Le cookie est effacé et sa session éventuelle est révoquée.',
  })
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    await this.commands.execute(new LogoutCommand(this.cookies.read(request)));
    this.cookies.clear(response);
  }
}
