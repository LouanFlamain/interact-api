import { Controller, Get, Header } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUserDto } from '../auth.dto.js';
import { CurrentUser } from '../session-auth.guard.js';

@ApiTags('Authentification')
@Controller('auth')
export class GetMeController {
  @Get('me')
  @Header('Cache-Control', 'no-store')
  @ApiCookieAuth('session')
  @ApiOperation({ operationId: 'getCurrentUser' })
  @ApiOkResponse({ type: CurrentUserDto })
  @ApiUnauthorizedResponse({
    description: 'Session absente, invalide, révoquée ou expirée.',
  })
  getMe(@CurrentUser() user: CurrentUserDto): CurrentUserDto {
    return user;
  }
}
