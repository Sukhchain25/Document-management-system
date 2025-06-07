import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
  Get,
  Param,
  Patch,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UsersService } from './users.service';
import { createResponse } from '../shared/response.utils';
import { Roles } from '../shared/decorators/roles.decorator';
import { UserRole } from './enums/roles.enums';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PaginationParamsDto } from '../shared/dto/pagination-param.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../shared/guards/roles.guard';
@ApiTags('Users')
@Controller('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    try {
      await this.usersService.create(createUserDto);
      return createResponse(true, 'User created successfully');
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Unexpected error while creating user',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all users (Admin only)' })
  async findAll(@Query() pagination: PaginationParamsDto) {
    return this.usersService.findAll(pagination);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get user by ID (Admin only)' })
  async findOne(@Param('id') id: string) {
    try {
      const user = await this.usersService.findOne(id);
      return createResponse(true, 'User fetched successfully', user);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Unexpected error while fetching user',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch(':id/role')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update user role (Admin only)' })
  async updateRole(@Param('id') id: string, @Body('role') role: UserRole) {
    try {
      const updatedUser = await this.usersService.updateRole(id, role);
      return createResponse(
        true,
        'User role updated successfully',
        updatedUser,
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Unexpected error while updating user role',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete user by ID (Admin only)' })
  async deleteUser(@Param('id') id: string) {
    try {
      await this.usersService.deleteUser(id);
      return createResponse(true, 'User deleted successfully');
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Unexpected error while deleting user',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Toggle user active status (Admin only)' })
  async toggleActive(@Param('id') id: string) {
    try {
      const updatedUser = await this.usersService.toggleStatus(id);
      return createResponse(
        true,
        'User status toggled successfully',
        updatedUser,
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Unexpected error while toggling user status',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
