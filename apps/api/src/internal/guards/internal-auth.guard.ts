import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class InternalAuthGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing internal token');
    }

    const token = authHeader.split(' ')[1];
    const expectedKey = this.configService.get<string>('INTERNAL_API_KEY');

    if (!expectedKey) {
      console.error('INTERNAL_API_KEY is not configured on the server');
      throw new UnauthorizedException('Internal token mismatch');
    }

    if (token !== expectedKey) {
      throw new UnauthorizedException('Invalid internal token');
    }

    return true;
  }
}
