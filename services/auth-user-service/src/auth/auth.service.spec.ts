import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { RefreshToken } from './entities/referesh-token.entity';
import * as bcrypt from 'bcrypt';
import { createResponse } from '../shared/response.utils';

jest.mock('bcrypt');

const mockUser = {
  id: '1',
  email: 'test@example.com',
  password: 'hashedpass',
  firstName: 'Test',
  lastName: 'User',
  role: 'viewer',
};

const mockUsersService = {
  create: jest.fn(),
  findByEmail: jest.fn(),
  findById: jest.fn(),
};

const mockJwtService = {
  sign: jest.fn(),
  verify: jest.fn(),
};

const mockRefreshTokenRepo = {
  findOne: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  delete: jest.fn(),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        {
          provide: getRepositoryToken(RefreshToken),
          useValue: mockRefreshTokenRepo,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should hash password, create user, and return response', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedpass');
      mockUsersService.create.mockResolvedValue(mockUser);

      const dto = {
        email: 'test@example.com',
        password: 'plain',
        firstName: 'Test',
        lastName: 'User',
        phone: '123',
      };
      const result = await service.register(dto as any);

      expect(bcrypt.hash).toHaveBeenCalledWith('plain', 10);
      expect(mockUsersService.create).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'hashedpass',
        firstName: 'Test',
        lastName: 'User',
        phone: '123',
        role: 'viewer',
      });
      expect(result).toEqual(
        createResponse(true, 'User registered successfully', {
          email: mockUser.email,
          firstName: mockUser.firstName,
          lastName: mockUser.lastName,
          role: mockUser.role,
        }),
      );
    });

    it('should throw error if user creation fails', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedpass');
      mockUsersService.create.mockRejectedValue(new Error('fail'));
      const dto = {
        email: 'test@example.com',
        password: 'plain',
        firstName: 'Test',
        lastName: 'User',
        phone: '123',
      };
      await expect(service.register(dto as any)).rejects.toThrow('fail');
    });
  });

  describe('login', () => {
    it('should throw UnauthorizedException if user not found', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      await expect(
        service.login({ email: 'x', password: 'y' } as any),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      await expect(
        service.login({ email: 'x', password: 'y' } as any),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return tokens if credentials are valid', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jest
        .spyOn<any, any>(service, 'generateTokens')
        .mockResolvedValue('tokenResponse');
      const result = await service.login({ email: 'x', password: 'y' } as any);
      expect(result).toBe('tokenResponse');
    });
  });

  describe('generateTokens', () => {
    it('should create and save new refresh token if not exists', async () => {
      mockJwtService.sign
        .mockReturnValueOnce('access')
        .mockReturnValueOnce('refresh');
      mockRefreshTokenRepo.findOne.mockResolvedValue(null);
      mockRefreshTokenRepo.create.mockReturnValue({
        token: 'refresh',
        user: mockUser,
      });
      mockRefreshTokenRepo.save.mockResolvedValue({});

      const result = await (service as any).generateTokens(mockUser);

      expect(mockJwtService.sign).toHaveBeenCalledTimes(2);
      expect(mockRefreshTokenRepo.create).toHaveBeenCalledWith({
        token: 'refresh',
        user: mockUser,
      });
      expect(mockRefreshTokenRepo.save).toHaveBeenCalled();
      expect(result).toEqual(
        createResponse(true, 'Login successful', {
          accessToken: 'access',
          refreshToken: 'refresh',
          user: {
            email: mockUser.email,
            firstName: mockUser.firstName,
            lastName: mockUser.lastName,
            role: mockUser.role,
          },
        }),
      );
    });

    it('should update existing refresh token', async () => {
      mockJwtService.sign
        .mockReturnValueOnce('access')
        .mockReturnValueOnce('refresh');
      mockRefreshTokenRepo.findOne.mockResolvedValue({
        token: 'old',
        user: mockUser,
      });
      mockRefreshTokenRepo.save.mockResolvedValue({});

      const result = await (service as any).generateTokens(mockUser);

      expect(mockRefreshTokenRepo.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('refreshToken', () => {
    it('should throw ForbiddenException if token is invalid', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('fail');
      });
      await expect(service.refreshToken('badtoken')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ForbiddenException if stored token not found', async () => {
      mockJwtService.verify.mockReturnValue({ sub: '1' });
      mockRefreshTokenRepo.findOne.mockResolvedValue(null);
      await expect(service.refreshToken('sometoken')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ForbiddenException if user not found', async () => {
      mockJwtService.verify.mockReturnValue({ sub: '1' });
      mockRefreshTokenRepo.findOne.mockResolvedValue({ token: 'sometoken' });
      mockUsersService.findById.mockResolvedValue(null);
      await expect(service.refreshToken('sometoken')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should return new tokens if refresh token is valid', async () => {
      mockJwtService.verify.mockReturnValue({ sub: '1' });
      mockRefreshTokenRepo.findOne.mockResolvedValue({ token: 'sometoken' });
      mockUsersService.findById.mockResolvedValue(mockUser);
      jest
        .spyOn<any, any>(service, 'generateTokens')
        .mockResolvedValue('tokenResponse');
      const result = await service.refreshToken('sometoken');
      expect(result).toBe('tokenResponse');
    });
  });

  describe('logout', () => {
    it('should delete refresh tokens and return response', async () => {
      mockRefreshTokenRepo.delete.mockResolvedValue({});
      const result = await service.logout('1');
      expect(mockRefreshTokenRepo.delete).toHaveBeenCalledWith({
        user: { id: '1' },
      });
      expect(result).toEqual(
        createResponse(true, 'User logged out successfully', null),
      );
    });
  });
});
