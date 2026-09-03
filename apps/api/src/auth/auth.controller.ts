import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import type { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { User } from '../users/entities/user.entity';

// --- DTOs ---

class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  @MinLength(1)
  name: string;
}

// --- Controller ---

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.authService.register(
      dto.email,
      dto.password,
      dto.name,
    );
    this.authService.setAuthCookie(res, user);
    return { user: this.authService.sanitizeUser(user) };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('local'))
  login(
    @Req() req: Request & { user: User },
    @Res({ passthrough: true }) res: Response,
  ) {
    this.authService.setAuthCookie(res, req.user);
    return { user: this.authService.sanitizeUser(req.user) };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) res: Response) {
    this.authService.clearAuthCookie(res);
    return { message: 'Logged out' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() req: Request & { user: User }) {
    return { user: this.authService.sanitizeUser(req.user) };
  }

  // --- Google OAuth ---

  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleLogin() {
    // Guard redirects to Google
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  googleCallback(@Req() req: Request & { user: User }, @Res() res: Response) {
    this.authService.setAuthCookie(res, req.user);
    const frontendUrl =
      this.config.get<string>('frontendUrl') || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/dashboard`);
  }

  // --- GitHub OAuth ---

  @Get('github')
  @UseGuards(AuthGuard('github'))
  githubLogin() {
    // Guard redirects to GitHub
  }

  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  githubCallback(@Req() req: Request & { user: User }, @Res() res: Response) {
    this.authService.setAuthCookie(res, req.user);
    const frontendUrl =
      this.config.get<string>('frontendUrl') || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/dashboard`);
  }
}
