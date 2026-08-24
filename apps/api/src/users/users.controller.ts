import { Controller, Get, Patch, Body, Req, UseGuards } from '@nestjs/common';
import { IsString, IsOptional, IsUrl } from 'class-validator';
import { Request } from 'express';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from './entities/user.entity';

class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsUrl()
  avatarUrl?: string;
}

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getMe(@Req() req: Request & { user: User }) {
    // The JwtAuthGuard populates req.user. We can just return it,
    // or fetch the latest from the database to be safe.
    const user = await this.usersService.findById(req.user.id);
    return { user };
  }

  @Patch('me')
  async updateMe(
    @Body() dto: UpdateUserDto,
    @Req() req: Request & { user: User },
  ) {
    const user = await this.usersService.updateUser(req.user.id, dto);
    return { user };
  }

  @Get('org')
  async getUsersByOrg(@Req() req: Request & { user: User }) {
    const users = await this.usersService.findUsersByOrg(req.user.orgId);
    return { users };
  }
}
