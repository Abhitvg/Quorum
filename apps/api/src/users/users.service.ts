import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { OrgsService } from '../orgs/orgs.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly orgsService: OrgsService,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOneBy({ email });
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepo.findOneBy({ id });
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    return this.userRepo.findOneBy({ googleId });
  }

  /**
   * Create a user with email/password.
   * Auto-creates a default personal org.
   */
  async createWithPassword(
    email: string,
    password: string,
    name: string,
  ): Promise<User> {
    const existing = await this.findByEmail(email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    // Create default org first
    const org = await this.orgsService.createDefaultOrg(name);

    const passwordHash = await bcrypt.hash(password, 12);
    const user = this.userRepo.create({
      email,
      passwordHash,
      name,
      orgId: org.id,
    });

    return this.userRepo.save(user);
  }

  /**
   * Create or find a user via Google OAuth.
   * Auto-creates a default personal org if new.
   */
  async findOrCreateFromGoogle(profile: {
    googleId: string;
    email: string;
    name: string;
    avatarUrl?: string;
  }): Promise<User> {
    // Check if already linked via Google ID
    let user = await this.findByGoogleId(profile.googleId);
    if (user) return user;

    // Check if email exists (link Google to existing account)
    user = await this.findByEmail(profile.email);
    if (user) {
      user.googleId = profile.googleId;
      if (profile.avatarUrl) user.avatarUrl = profile.avatarUrl;
      return this.userRepo.save(user);
    }

    // Brand new user — create org + user
    const org = await this.orgsService.createDefaultOrg(profile.name);
    const newUser = this.userRepo.create({
      email: profile.email,
      name: profile.name,
      googleId: profile.googleId,
      avatarUrl: profile.avatarUrl || null,
      orgId: org.id,
    });

    return this.userRepo.save(newUser);
  }

  /**
   * Validate email/password for local login.
   */
  async validateCredentials(
    email: string,
    password: string,
  ): Promise<User | null> {
    const user = await this.findByEmail(email);
    if (!user || !user.passwordHash) return null;

    const isValid = await bcrypt.compare(password, user.passwordHash);
    return isValid ? user : null;
  }
}
