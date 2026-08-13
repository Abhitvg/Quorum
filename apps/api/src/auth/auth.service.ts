import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';

export interface JwtPayload {
  sub: string; // user id
  email: string;
  orgId: string;
}

@Injectable()
export class AuthService {
  private readonly cookieName = 'qr_token';

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Register a new user with email/password.
   * Returns the user (cookie is set by the controller).
   */
  async register(email: string, password: string, name: string): Promise<User> {
    return this.usersService.createWithPassword(email, password, name);
  }

  /**
   * Validate email/password credentials.
   */
  async validateCredentials(email: string, password: string): Promise<User | null> {
    return this.usersService.validateCredentials(email, password);
  }

  /**
   * Generate a JWT and set it as an httpOnly cookie.
   */
  setAuthCookie(res: Response, user: User): void {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      orgId: user.orgId,
    };

    const token = this.jwtService.sign(payload);

    res.cookie(this.cookieName, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });
  }

  /**
   * Clear the auth cookie.
   */
  clearAuthCookie(res: Response): void {
    res.clearCookie(this.cookieName, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
  }

  /**
   * Get user from JWT payload (used by JwtStrategy).
   */
  async getUserFromPayload(payload: JwtPayload): Promise<User | null> {
    return this.usersService.findById(payload.sub);
  }

  /**
   * Serialize user for API responses (strip sensitive fields).
   */
  sanitizeUser(user: User) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      orgId: user.orgId,
      createdAt: user.createdAt,
    };
  }
}
