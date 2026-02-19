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
  // async checkPhone(phone: string) {
  //   const user = await this.usersService.findByPhone(phone);

  //   return {
  //     isNewUser: !user,
  //   };
  // }

  // async checkPhone(phone: string) {
  //   const user = await this.usersService.findByPhone(phone);

  //   if (user) {
  //     // ✅ EXISTING USER
  //     const token = this.jwtService.sign({
  //       sub: user._id,
  //       phone: user.phone,
  //     });

  //     return {
  //       isNewUser: false,
  //       token,
  //       user,
  //     };
  //   }

  //   // ❌ NEW USER
  //   return {
  //     isNewUser: true,
  //   };
  // }

  // 🆕 STEP 2: REGISTER AFTER OTP
  // async register(data: {
  //   phone: string;
  //   name: string;
  //   email: string;
  //   address: string[];
  // }) {
  //   const user = await this.usersService.registerOrLogin(data);

  //   const token = this.jwtService.sign({
  //     sub: user._id,
  //     phone: user.phone,
  //     role: user.role,
  //     address: user.address,
  //   });

  //   return {
  //     token,
  //     user,
  //   };
  // }

  // async login(phone: string) {
  //   let user = await this.usersService.findByPhone(phone);

  //   if (!user) {
  //     throw new UnauthorizedException('User not registered');
  //   }

  //   const token = this.jwtService.sign({
  //     sub: user._id,
  //     phone: user.phone,
  //   });

  //   return { token };
  // }

  // for otp..
  async otpLogin(data: {
    firebaseToken: string;
    name: string;
    email?: string;
    address?: string[];
  }) {

    const decoded = await this.firebaseService.verifyToken(data.firebaseToken);

    const phone = decoded.phone_number;
    if (!phone) throw new UnauthorizedException('Phone not found');

    let user = await this.usersService.findByPhone(phone);

    if (!user) {
      user = await this.usersService.registerOrLogin({
        phone,
        name: data.name,
        email: data.email || '',
        address: data.address || [],
      });
    }

    const jwt = this.jwtService.sign({
      sub: user._id,
      phone: user.phone,
      role: user.role,
    });

    return {
      token: jwt,
      user,
    };
  }

}
