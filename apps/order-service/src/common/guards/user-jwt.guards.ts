import { Injectable , UnauthorizedException} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class UserJwtGuard extends AuthGuard('user-jwt') {
     handleRequest(err, user, info) {
    console.log("JWT ERROR:", err);
    console.log("JWT USER:", user);
    console.log("JWT INFO:", info);
    if (err || !user) {
      throw err || new UnauthorizedException();
    }
    return user;
  }
}
