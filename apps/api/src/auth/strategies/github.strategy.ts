import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(
    private readonly usersService: UsersService,
    config: ConfigService,
  ) {
    super({
      clientID: config.get<string>('github.clientId') as string,
      clientSecret: config.get<string>('github.clientSecret') as string,
      callbackURL: config.get<string>('github.callbackUrl') as string,
      scope: ['user:email'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: {
      id: string;
      username?: string;
      displayName?: string;
      emails?: { value: string }[];
      photos?: { value: string }[];
    },
    done: (err: Error | null, user?: unknown) => void,
  ): Promise<void> {
    const email = profile.emails?.[0]?.value;
    if (!email) {
      return done(
        new Error(
          'GitHub account has no public email. Please make your email public in GitHub settings.',
        ),
      );
    }

    const user = await this.usersService.findOrCreateFromGithub({
      githubId: profile.id,
      email,
      name: profile.displayName || profile.username || email.split('@')[0],
      avatarUrl: profile.photos?.[0]?.value,
    });

    done(null, user);
  }
}
