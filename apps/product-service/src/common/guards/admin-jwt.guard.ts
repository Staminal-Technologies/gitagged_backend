import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class AdminJwtGuard extends AuthGuard('admin-jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(err, user) {
    if (err || !user || user.role !== 'admin') {
      throw new UnauthorizedException('Admin access only');
    }
    return user;
  }
}
