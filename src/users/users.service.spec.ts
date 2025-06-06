import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { UserRole } from './enums/roles.enums';

const mockUser = {
  id: '1',
  email: 'test@example.com',
  phone: '1234567890',
  password: 'hashedpass',
  firstName: 'Test',
  lastName: 'User',
  role: UserRole.VIEWER,
  isActive: true,
};

const mockUserRepository = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should throw ConflictException if user exists', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      await expect(
        service.create({ email: mockUser.email, phone: mockUser.phone } as any),
      ).rejects.toThrow(ConflictException);
    });

    it('should create and save user if not exists', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue(mockUser);
      mockUserRepository.save.mockResolvedValue(mockUser);
      const dto = { email: mockUser.email, phone: mockUser.phone } as any;
      const result = await service.create(dto);
      expect(mockUserRepository.create).toHaveBeenCalledWith(dto);
      expect(mockUserRepository.save).toHaveBeenCalledWith(mockUser);
      expect(result).toBe(mockUser);
    });
  });

  describe('findByEmail', () => {
    it('should return user if found', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      const result = await service.findByEmail(mockUser.email);
      expect(result).toBe(mockUser);
    });

    it('should throw NotFoundException if not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      await expect(service.findByEmail('notfound@example.com')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findById', () => {
    it('should return user if found', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      const result = await service.findById(mockUser.id);
      expect(result).toBe(mockUser);
    });

    it('should return null if not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      const result = await service.findById('notfound');
      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return paginated users', async () => {
      mockUserRepository.find.mockResolvedValue([mockUser]);
      const result = await service.findAll({ skip: 0, limit: 10 });
      expect(mockUserRepository.find).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
      });
      expect(result).toEqual([mockUser]);
    });
  });

  describe('findOne', () => {
    it('should return user if found', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      const result = await service.findOne(mockUser.id);
      expect(result).toBe(mockUser);
    });

    it('should throw NotFoundException if not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      await expect(service.findOne('notfound')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateRole', () => {
    it('should update user role and return updated user', async () => {
      mockUserRepository.update.mockResolvedValue(undefined);
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      const result = await service.updateRole(mockUser.id, UserRole.ADMIN);
      expect(mockUserRepository.update).toHaveBeenCalledWith(
        { id: mockUser.id },
        { role: UserRole.ADMIN },
      );
      expect(result).toBe(mockUser);
    });
  });

  describe('toggleStatus', () => {
    it('should toggle user status and return updated user', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.update.mockResolvedValue(undefined);
      const result = await service.toggleStatus(mockUser.id);
      expect(mockUserRepository.update).toHaveBeenCalledWith(
        { id: mockUser.id },
        { isActive: !mockUser.isActive },
      );
      expect(result).toBe(mockUser);
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      await expect(service.toggleStatus('notfound')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deleteUser', () => {
    it('should remove user if found', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.remove.mockResolvedValue(undefined);
      await service.deleteUser(mockUser.id);
      expect(mockUserRepository.remove).toHaveBeenCalledWith(mockUser);
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      await expect(service.deleteUser('notfound')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
