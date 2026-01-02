import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { Admin } from './schema/admin.schema';

@Injectable()
export class AdminAuthService {
  constructor(
    @InjectModel(Admin.name) private adminModel: Model<Admin>,
    private jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    const admin = await this.adminModel.findOne({ email });
    if (!admin) throw new UnauthorizedException('Invalid credentials');

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    return {
      accessToken: this.jwtService.sign({
        sub: admin._id,
        role: 'admin',
      }),
    };
  }
}
