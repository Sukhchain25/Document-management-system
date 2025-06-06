import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { HttpException, HttpStatus } from '@nestjs/common';

const mockAuthService = {
  register: jest.fn(),
  login: jest.fn(),
  logout: jest.fn(),
};

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should register a user and return result', async () => {
      const dto = { email: 'test@example.com', password: 'pass' };
      const result = { id: '1', email: 'test@example.com' };
      mockAuthService.register.mockResolvedValue(result);
      expect(await controller.register(dto as any)).toEqual(result);
      expect(mockAuthService.register).toHaveBeenCalledWith(dto);
    });

    it('should throw HttpException on error', async () => {
      mockAuthService.register.mockRejectedValue(new Error('fail'));
      await expect(controller.register({} as any)).rejects.toThrow(
        HttpException,
      );
    });
  });

  describe('login', () => {
    it('should login a user and return tokens', async () => {
      const dto = { email: 'test@example.com', password: 'pass' };
      const tokens = { accessToken: 'jwt', refreshToken: 'refresh' };
      mockAuthService.login.mockResolvedValue(tokens);
      expect(await controller.login(dto as any)).toEqual(tokens);
      expect(mockAuthService.login).toHaveBeenCalledWith(dto);
    });

    it('should throw HttpException on error', async () => {
      mockAuthService.login.mockRejectedValue(new Error('fail'));
      await expect(controller.login({} as any)).rejects.toThrow(HttpException);
    });
  });

  describe('logout', () => {
    it('should logout a user and return result', async () => {
      const req = { user: { sub: '1' } } as any;
      const result = { success: true };
      mockAuthService.logout.mockResolvedValue(result);
      expect(await controller.logout(req)).toEqual(result);
      expect(mockAuthService.logout).toHaveBeenCalledWith('1');
    });
  });
});
