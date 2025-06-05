import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  async register(@Body() dto: RegisterDto) {
    try {
      return await this.authService.register(dto);
    } catch (err) {
      throw err instanceof HttpException
        ? err
        : new HttpException(
            'Registration failed',
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
    }
  }

  @Post('login')
  @ApiOperation({ summary: 'Login user and return JWT' })
  async login(@Body() dto: LoginDto) {
    try {
      return await this.authService.login(dto);
    } catch (err) {
      throw err instanceof HttpException
        ? err
        : new HttpException('Login failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
