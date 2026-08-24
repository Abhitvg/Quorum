import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'crypto';

@Injectable()
export class InternalAuthGuard implements CanActivate {
  private readonly logger = new Logger(InternalAuthGuard.name);

  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<import('express').Request>();
    const authHeader = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing internal token');
    }

    const token = authHeader.split(' ')[1];
    const expectedKey = this.configService.get<string>('internalApiKey');

    if (!expectedKey) {
      this.logger.error('INTERNAL_API_KEY is not configured on the server');
      throw new UnauthorizedException('Internal token mismatch');
    }

    const tokenBuffer = Buffer.from(token);
    const expectedKeyBuffer = Buffer.from(expectedKey);

    if (
      tokenBuffer.length !== expectedKeyBuffer.length ||
      !timingSafeEqual(tokenBuffer, expectedKeyBuffer)
    ) {
      throw new UnauthorizedException('Invalid internal token');
    }

    return true;
  }
}
