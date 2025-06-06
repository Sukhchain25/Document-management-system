import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { createResponse } from '../shared/response.utils';
import { HttpException, HttpStatus } from '@nestjs/common';
import { UserRole } from './enums/roles.enums';

const mockUser = {
  id: '1',
  email: 'test@example.com',
  role: UserRole.ADMIN,
  isActive: true,
};
const mockUsers = [mockUser];

const mockUsersService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  updateRole: jest.fn(),
  deleteUser: jest.fn(),
  toggleStatus: jest.fn(),
};

describe('UsersController', () => {
  let controller: UsersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: mockUsersService }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should create a user and return success response', async () => {
      mockUsersService.create.mockResolvedValue(undefined);
      const dto = {
        email: 'test@example.com',
        phone: '1234567890',
        password: 'pass',
      };
      const result = await controller.register(dto as any);
      expect(result).toEqual(createResponse(true, 'User created successfully'));
      expect(mockUsersService.create).toHaveBeenCalledWith(dto);
    });

    it('should throw original HttpException when service throws HttpException', async () => {
      const error = new HttpException('Email exists', HttpStatus.BAD_REQUEST);
      mockUsersService.create.mockRejectedValue(error);
      await expect(controller.register({} as any)).rejects.toThrow(error);
    });

    it('should wrap non-HttpException errors', async () => {
      const error = new Error('Database error');
      mockUsersService.create.mockRejectedValue(error);
      await expect(controller.register({} as any)).rejects.toThrow(
        new HttpException(
          'Unexpected error while creating user',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      mockUsersService.findAll.mockResolvedValue(mockUsers);
      const result = await controller.findAll({ skip: 0, limit: 10 });
      expect(result).toEqual(mockUsers);
      expect(mockUsersService.findAll).toHaveBeenCalled();
    });

    it('should handle empty result', async () => {
      mockUsersService.findAll.mockResolvedValue([]);
      const result = await controller.findAll({ skip: 0, limit: 10 });
      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a user', async () => {
      mockUsersService.findOne.mockResolvedValue(mockUser);
      const result = await controller.findOne('1');
      expect(result).toEqual(
        createResponse(true, 'User fetched successfully', mockUser),
      );
      expect(mockUsersService.findOne).toHaveBeenCalledWith('1');
    });

    it('should throw original HttpException when service throws HttpException', async () => {
      const error = new HttpException('Not found', HttpStatus.NOT_FOUND);
      mockUsersService.findOne.mockRejectedValue(error);
      await expect(controller.findOne('1')).rejects.toThrow(error);
    });

    it('should wrap non-HttpException errors', async () => {
      const error = new Error('Database error');
      mockUsersService.findOne.mockRejectedValue(error);
      await expect(controller.findOne('1')).rejects.toThrow(
        new HttpException(
          'Unexpected error while fetching user',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });
  });

  describe('updateRole', () => {
    it('should update user role', async () => {
      mockUsersService.updateRole.mockResolvedValue({
        ...mockUser,
        role: UserRole.ADMIN,
      });
      const result = await controller.updateRole('1', UserRole.ADMIN);
      expect(result).toEqual(
        createResponse(true, 'User role updated successfully', {
          ...mockUser,
          role: UserRole.ADMIN,
        }),
      );
      expect(mockUsersService.updateRole).toHaveBeenCalledWith(
        '1',
        UserRole.ADMIN,
      );
    });

    it('should throw original HttpException when service throws HttpException', async () => {
      const error = new HttpException('Invalid role', HttpStatus.BAD_REQUEST);
      mockUsersService.updateRole.mockRejectedValue(error);
      await expect(
        controller.updateRole('1', 'invalid' as any),
      ).rejects.toThrow(error);
    });

    it('should wrap non-HttpException errors', async () => {
      const error = new Error('Database error');
      mockUsersService.updateRole.mockRejectedValue(error);
      await expect(controller.updateRole('1', UserRole.ADMIN)).rejects.toThrow(
        new HttpException(
          'Unexpected error while updating user role',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });
  });

  describe('deleteUser', () => {
    it('should delete a user', async () => {
      mockUsersService.deleteUser.mockResolvedValue(undefined);
      const result = await controller.deleteUser('1');
      expect(result).toEqual(createResponse(true, 'User deleted successfully'));
      expect(mockUsersService.deleteUser).toHaveBeenCalledWith('1');
    });

    it('should throw original HttpException when service throws HttpException', async () => {
      const error = new HttpException('Not found', HttpStatus.NOT_FOUND);
      mockUsersService.deleteUser.mockRejectedValue(error);
      await expect(controller.deleteUser('1')).rejects.toThrow(error);
    });

    it('should wrap non-HttpException errors', async () => {
      const error = new Error('Database error');
      mockUsersService.deleteUser.mockRejectedValue(error);
      await expect(controller.deleteUser('1')).rejects.toThrow(
        new HttpException(
          'Unexpected error while deleting user',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });
  });

  describe('toggleActive', () => {
    it('should toggle user status', async () => {
      mockUsersService.toggleStatus.mockResolvedValue({
        ...mockUser,
        isActive: false,
      });
      const result = await controller.toggleActive('1');
      expect(result).toEqual(
        createResponse(true, 'User status toggled successfully', {
          ...mockUser,
          isActive: false,
        }),
      );
      expect(mockUsersService.toggleStatus).toHaveBeenCalledWith('1');
    });

    it('should throw original HttpException when service throws HttpException', async () => {
      const error = new HttpException('Not found', HttpStatus.NOT_FOUND);
      mockUsersService.toggleStatus.mockRejectedValue(error);
      await expect(controller.toggleActive('1')).rejects.toThrow(error);
    });

    it('should wrap non-HttpException errors', async () => {
      const error = new Error('Database error');
      mockUsersService.toggleStatus.mockRejectedValue(error);
      await expect(controller.toggleActive('1')).rejects.toThrow(
        new HttpException(
          'Unexpected error while toggling user status',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });
  });
});
