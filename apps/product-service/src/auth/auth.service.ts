import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { FirebaseService } from '../common/firebase/firebase.service';
import { Seller } from '../schema/seller.schema';
import { Model } from 'mongoose';
import { Admin } from '../admin-auth/schema/admin.schema';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Admin.name) private adminModel: Model<Admin>,
    @InjectModel(Seller.name) private sellerModel: Model<Seller>,
    private usersService: UsersService,
    private jwtService: JwtService,
    private firebaseService: FirebaseService,
  ) { }

  // for otp..
  async otpLogin(data: { firebaseToken: string }) {
    const decoded = await this.firebaseService.verifyToken(data.firebaseToken);
    const phone = decoded.phone_number;

    let user = await this.usersService.findByPhone(phone);

    if (!user) {
      return {
        isNewUser: true,
        phone,
      };
    }

    const jwt = this.jwtService.sign({
      sub: user._id,
      phone: user.phone,
      role: user.role,
    });

    return {
      token: jwt,
      user,
      isNewUser: false,
    };
  }

  // admin panel login..
  async login(identifier: string, password: string) {

    // 🔵 Try Admin
    console.log("Entered identifier:", identifier);
    console.log("Entered password:", password);

    // 🔵 Check Admin (email OR name)
    const admin = await this.adminModel.findOne({
      $or: [
        { email: identifier },
        { name: identifier },
      ],
    });

    console.log("Admin found:", admin);

    if (admin) {
      const match = await bcrypt.compare(password, admin.password);
      console.log("Password match:", match);
    }

    if (admin && await bcrypt.compare(password, admin.password)) {
      return {
        accessToken: this.jwtService.sign({
          sub: admin._id,
          role: 'ADMIN',
        }),
        role: 'ADMIN',
      };
    }

    // 🟠 Try Seller
    // 🟠 Check Seller (email OR sellerName)
    const seller = await this.sellerModel.findOne({
      $or: [
        { email: identifier },
        { sellerName: identifier },
      ],
    });

    if (seller) {

      const match = await bcrypt.compare(password, seller.password);
      console.log("Password match:", match);

      if (seller.status !== 'APPROVED') {
        throw new UnauthorizedException('Seller not approved');
      }

      const isMatch = await bcrypt.compare(password, seller.password);

      if (isMatch) {
        return {
          accessToken: this.jwtService.sign({
            sub: seller._id,
            role: 'SELLER',
          }),
          role: 'SELLER',
        };
      }
    }

    throw new UnauthorizedException('Invalid credentials');
  }

  //reset pass for admin dashboard 
  async resetPassword(phone: string, newPassword: string) {

    const hashed = await bcrypt.hash(newPassword, 10);

    // 🔵 Check Admin
    const admin = await this.adminModel.findOne({ mobileNumber: phone });

    if (admin) {
      admin.password = hashed;
      await admin.save();
      return { message: "Admin password updated" };
    }

    // 🟠 Check Seller
    const seller = await this.sellerModel.findOne({ mobileNumber: phone });

    if (seller) {
      seller.password = hashed;
      await seller.save();
      return { message: "Seller password updated" };
    }

    throw new NotFoundException("Account not found with this mobile number");
  }

}
