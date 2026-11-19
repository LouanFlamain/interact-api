import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import type { Identity, SystemRole } from '../../../domain/identity.js';

export class EmailRequestDto {
  @ApiProperty({ format: 'email', maxLength: 320 })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsEmail()
  @MaxLength(320)
  email!: string;
}

export class RegisterRequestDto extends EmailRequestDto {
  @ApiProperty({
    format: 'password',
    writeOnly: true,
    minLength: 15,
    maxLength: 128,
  })
  @IsString()
  @MinLength(15)
  @MaxLength(128)
  password!: string;
}

export class LoginRequestDto extends EmailRequestDto {
  @ApiProperty({
    format: 'password',
    writeOnly: true,
    minLength: 1,
    maxLength: 128,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  password!: string;
}

class EmailTokenDto {
  @ApiProperty({
    writeOnly: true,
    maxLength: 80,
    description: 'Jeton du lien reçu par e-mail.',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  token!: string;
}

export class VerifyEmailDto extends EmailTokenDto {
  @ApiProperty({
    format: 'password',
    writeOnly: true,
    minLength: 15,
    maxLength: 128,
    description: 'Mot de passe choisi par la personne qui confirme l’adresse.',
  })
  @IsString()
  @MinLength(15)
  @MaxLength(128)
  password!: string;
}

export class ResetPasswordDto extends EmailTokenDto {
  @ApiProperty({
    format: 'password',
    writeOnly: true,
    minLength: 15,
    maxLength: 128,
  })
  @IsString()
  @MinLength(15)
  @MaxLength(128)
  newPassword!: string;
}

export class CurrentUserDto implements Identity {
  @ApiProperty({ type: String, format: 'uuid' }) readonly id!: string;
  @ApiProperty({ type: String, format: 'email' }) readonly email!: string;
  @ApiProperty({ enum: ['USER', 'ADMIN'] }) readonly systemRole!: SystemRole;
  @ApiProperty({ type: Boolean }) readonly emailVerified!: boolean;
}
