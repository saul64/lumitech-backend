import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  BadRequestException,
  Param,
  HttpException,
  UseGuards,
  Req,
} from '@nestjs/common';

import { UserService } from '../services/user.service';
import { CreateUserDto } from '../../auth/dto/create-user.dto';
import { ResetPasswordDto } from 'src/auth/dto/reset-password.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ChangePasswordDto } from 'src/auth/dto/change-password.dto';
import { JwtPayload } from 'jsonwebtoken';

@Controller('user') // Prefix route
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('register') // Route register user
  @HttpCode(HttpStatus.CREATED) // Return code 201 if response is successful
  async register(
    @Body() createUserDto: CreateUserDto,
  ): Promise<{ message: string }> {
    await this.userService.createUser(createUserDto);
    return { message: 'Usuario registrado correctamente' };
  }

  @Post('forget-password')
  async forgetPassword(@Body('email') email: string) {
    return this.userService.forgetPassword(email);
  }

  @Post('reset-password/:token')
  async resetPassword(
    @Param('token') token: string,
    @Body() resetPasswordDto: ResetPasswordDto,
  ): Promise<{ msg: string }> {
    return this.userService.resetPassword(token, resetPasswordDto);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Req() req: { user: JwtPayload },
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    const uuid = req.user.uuid;
    return this.userService.changePassword(uuid, changePasswordDto);
  }
}
