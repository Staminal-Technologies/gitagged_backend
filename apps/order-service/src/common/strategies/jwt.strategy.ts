import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'user-jwt') {
  constructor(configService: ConfigService) {
    console.log("JWT_SECRET - order-service:", configService.get('JWT_SECRET'));
    const secret = configService.get<string>('JWT_SECRET');

    console.log("ORDER SERVICE JWT SECRET 👉", secret);
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }


  async validate(payload: any) {
    console.log("JWT VALIDATED in order-service:", payload);
    return payload;
  }
}
