import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(configService: ConfigService) {
    console.log("JWT STRATEGY INITIALIZED - orderService");
  super({
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
     secretOrKey: configService.get<string>('JWT_SECRET'),
  });
}


  async validate(payload: any) {
    return payload;
  }
}
