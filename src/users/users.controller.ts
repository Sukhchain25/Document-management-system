import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    try {
      const user = await this.usersService.create(createUserDto);
      return {
        message: 'User created successfully',
        data: user,
      };
    } catch (error) {
      // Optional: logging here
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Unexpected error while creating user',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
