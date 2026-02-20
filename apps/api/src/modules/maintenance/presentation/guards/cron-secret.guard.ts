import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

@Injectable()
export class CronSecretGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const secret = process.env.CRON_SECRET;
    if (!secret) {
      throw new UnauthorizedException('CRON_SECRET is not configured');
    }
    const headerValue = request.headers['x-cron-secret'];
    if (typeof headerValue !== 'string') {
      throw new UnauthorizedException('Missing X-CRON-SECRET header');
    }
    if (headerValue !== secret) {
      throw new ForbiddenException('Invalid cron secret');
    }
    return true;
  }
}
