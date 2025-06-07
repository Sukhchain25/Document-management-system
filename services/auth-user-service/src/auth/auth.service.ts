import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createResponse } from '../shared/response.utils';
import { RefreshToken } from './entities/referesh-token.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepo: Repository<RefreshToken>,
  ) {}

  // Register just creates user, no tokens here
  async register(registerDto: RegisterDto) {
    const { email, password, firstName, lastName, phone } = registerDto;
    const hashedPassword = await bcrypt.hash(password, 10);
    try {
      const user = await this.usersService.create({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone,
        role: 'viewer',
      });
      return createResponse(true, 'User registered successfully', {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      });
    } catch (error) {
      throw error;
    }
  }

  // Login issues tokens and saves refresh token entity
  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateTokens(user);
  }

  // Generates access + refresh tokens, saves refresh token to DB
  private async generateTokens(user: any) {
    const payload = { sub: user.id, email: user.email, role: user.role };

    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    // Save refresh token to DB (create or update existing)
    const existingToken = await this.refreshTokenRepo.findOne({
      where: { user: { id: user.id } },
    });
    if (existingToken) {
      existingToken.token = refreshToken;
      await this.refreshTokenRepo.save(existingToken);
    } else {
      const tokenEntity = this.refreshTokenRepo.create({
        token: refreshToken,
        user,
      });
      await this.refreshTokenRepo.save(tokenEntity);
    }

    return createResponse(true, 'Login successful', {
      accessToken,
      refreshToken,
      user: {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    });
  }

  // Refresh access token using valid refresh token
  async refreshToken(oldRefreshToken: string) {
    try {
      const payload = this.jwtService.verify(oldRefreshToken);

      const storedToken = await this.refreshTokenRepo.findOne({
        where: { token: oldRefreshToken },
      });
      if (!storedToken)
        throw new ForbiddenException('Refresh token invalid or expired');

      const user = await this.usersService.findById(payload.sub);
      if (!user) throw new ForbiddenException('User not found');

      return this.generateTokens(user);
    } catch (error) {
      throw new ForbiddenException('Invalid refresh token');
    }
  }

  // Logout deletes refresh token(s) for user
  async logout(userId: string) {
    await this.refreshTokenRepo.delete({ user: { id: userId } });
    return createResponse(true, 'User logged out successfully', null);
  }
}
