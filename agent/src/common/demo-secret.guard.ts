import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class DemoSecretGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const secretHeader = request.headers['x-demo-secret'];
    const expectedSecret = process.env.DEMO_SECRET || 'super-secret-demo-key';

    // TODO: Implement logic here (timing-safe comparison or rate limiting)
    if (!secretHeader || secretHeader !== expectedSecret) {
      throw new UnauthorizedException('Invalid or missing x-demo-secret header');
    }

    return true;
  }
}
