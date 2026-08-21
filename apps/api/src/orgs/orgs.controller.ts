import {
  Controller,
  Get,
  Patch,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { IsString, IsOptional, MinLength } from 'class-validator';
import { Request } from 'express';
import { OrgsService } from './orgs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';

class UpdateOrgDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsString()
  plan?: string;
}

@Controller('orgs')
@UseGuards(JwtAuthGuard)
export class OrgsController {
  constructor(private readonly orgsService: OrgsService) {}

  @Get('my-org')
  async getMyOrg(@Req() req: Request & { user: User }) {
    const org = await this.orgsService.findById(req.user.orgId);
    return { org };
  }

  @Patch('my-org')
  async updateMyOrg(
    @Body() dto: UpdateOrgDto,
    @Req() req: Request & { user: User },
  ) {
    const org = await this.orgsService.updateOrg(req.user.orgId, dto);
    return { org };
  }
}
