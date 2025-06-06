import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  let configService: ConfigService;

  beforeEach(() => {
    configService = {
      get: jest.fn(),
    } as any;
  });

  it('should throw if JWT_SECRET is not defined', () => {
    (configService.get as jest.Mock).mockReturnValue(undefined);
    expect(() => new JwtStrategy(configService)).toThrow(
      'JWT_SECRET is not defined in environment variables',
    );
  });

  it('should construct if JWT_SECRET is defined', () => {
    (configService.get as jest.Mock).mockReturnValue('testsecret');
    expect(() => new JwtStrategy(configService)).not.toThrow();
  });

  it('should validate and return payload fields', async () => {
    (configService.get as jest.Mock).mockReturnValue('testsecret');
    const strategy = new JwtStrategy(configService);
    const payload = { sub: '1', email: 'test@example.com', role: 'admin' };
    expect(await strategy.validate(payload)).toEqual(payload);
  });
});
