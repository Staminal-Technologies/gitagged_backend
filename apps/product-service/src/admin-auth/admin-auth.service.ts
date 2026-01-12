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
  console.log('📩 LOGIN INPUT:', email, password);

  const admin = await this.adminModel.findOne({ email });

  console.log('🧑 ADMIN FROM DB:', admin);

  if (!admin) {
    console.log('❌ ADMIN NOT FOUND');
    throw new UnauthorizedException('Invalid credentials');
  }

  const isMatch = await bcrypt.compare(password, admin.password);
  console.log('🔐 PASSWORD MATCH:', isMatch);

  if (!isMatch) {
    console.log('❌ PASSWORD MISMATCH');
    throw new UnauthorizedException('Invalid credentials');
  }

  return {
    accessToken: this.jwtService.sign({
      sub: admin._id.toString(),
      role: 'admin',
    }),
  };
}

}
