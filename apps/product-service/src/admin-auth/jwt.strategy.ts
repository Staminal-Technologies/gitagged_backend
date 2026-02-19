import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Admin, AdminDocument } from '../admin-auth/schema/admin.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class AdminJwtStrategy extends PassportStrategy(Strategy, 'admin-jwt') {
  constructor(
    configService: ConfigService,
    @InjectModel(Admin.name)
    private readonly adminModel: Model<AdminDocument>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get<string>('ADMIN_JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    console.log('JWT PAYLOAD:', payload);

    const admin = await this.adminModel.findById(payload.sub).lean();
    console.log('ADMIN FOUND:', admin);

    if (!admin) {
      throw new UnauthorizedException('Admin not found');
    }

    return {
      sub: admin._id,
      emailOrUserName: admin.emailOrUserName,
      mobileNumber: admin.mobileNumber,
      role: 'admin',
    };
  }

}
