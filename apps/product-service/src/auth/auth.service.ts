import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { FirebaseService } from '../common/firebase/firebase.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private firebaseService: FirebaseService,
  ) { }

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

  // for otp..
  async otpLogin(firebaseToken: string) {
    const decoded = await this.firebaseService.verifyToken(firebaseToken);

    const phone = decoded.phone_number;
    if (!phone) throw new UnauthorizedException('Phone not found');

    let user = await this.usersService.findByPhone(phone);

    if (!user) {
      user = await this.usersService.create({
        phone,
        name: 'User',
        isActive: true,
        isBlocked: false,
      });
    }

    const jwt = this.jwtService.sign({
      sub: user._id,
      phone: user.phone,
      role: 'user',
    });

    return {
      token: jwt,
      user,
    };
  }

}
