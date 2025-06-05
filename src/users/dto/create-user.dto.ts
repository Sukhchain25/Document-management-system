import {
  IsEmail,
  IsNotEmpty,
  MinLength,
  IsOptional,
  IsIn,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @MinLength(6)
  @IsNotEmpty()
  password: string;

  @ApiProperty({
    required: false,
    enum: ['admin', 'editor', 'viewer'],
    default: 'viewer',
  })
  @IsOptional()
  @IsIn(['admin', 'editor', 'viewer'])
  role?: 'admin' | 'editor' | 'viewer';
}
