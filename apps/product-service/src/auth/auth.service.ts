import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) { }

  // async register(data: any) {
  //   const hashed = await bcrypt.hash(data.password, 10);
  //   const user = await this.usersService.create({
  //     ...data,
  //     password: hashed,
  //   });

  //   return { id: user._id };
  // }

  // 🔍 STEP 1: CHECK PHONE
  async checkPhone(phone: string) {
    const user = await this.usersService.findByPhone(phone);

    if (user) {
      // ✅ EXISTING USER
      const token = this.jwtService.sign({
        sub: user._id,
        phone: user.phone,
      });

      return {
        isNewUser: false,
        token,
        user,
      };
    }

    // ❌ NEW USER
    return {
      isNewUser: true,
    };
  }

  // 🆕 STEP 2: REGISTER AFTER OTP
  async register(data: {
    phone: string;
    name: string;
    email: string;
    address: string;
  }) {
    const user = await this.usersService.create({
      phone: data.phone,
      name: data.name,
      email: data.email,
      address: data.address,
    });

    const token = this.jwtService.sign({
      sub: user._id,
      phone: user.phone,
    });

    return {
      token,
      user,
    };
  }

  async login(phone: string) {
    let user = await this.usersService.findByPhone(phone);

    if (!user) {
      throw new UnauthorizedException('User not registered');
    }

    const token = this.jwtService.sign({
      sub: user._id,
      phone: user.phone,
    });

    return { token };
  }
}
