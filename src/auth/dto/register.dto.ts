import {
  IsEmail,
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'Email address of the user',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'StrongP@ssw0rd',
    description:
      'Password must be 8-32 characters, include upper/lowercase letters and a number',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(32)
  @Matches(/(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}/, {
    message: 'Password too weak (include upper/lowercase letters and numbers)',
  })
  password: string;

  @ApiProperty({
    example: 'John',
    description: 'First name of the user',
  })
  @IsString()
  @MinLength(2)
  firstName: string;

  @ApiProperty({
    example: 'Doe',
    description: 'Last name of the user',
  })
  @IsString()
  @MinLength(2)
  lastName: string;

  @ApiPropertyOptional({
    example: '+919876543210',
    description: 'Phone number (optional)',
  })
  @IsOptional()
  @IsString()
  phone?: string;
}
