import { UnauthorizedException } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Seller } from 'apps/order-service/src/seller/schema/seller.schema';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { Injectable } from '@nestjs/common';

@Injectable()
export class SellerAuthService {
  constructor(
    @InjectModel(Seller.name) private sellerModel: Model<Seller>,
    private jwtService: JwtService,
  ) { }

  async login(email: string, password: string) {

    const seller = await this.sellerModel.findOne({ email });

    if (!seller)
      throw new UnauthorizedException("Invalid credentials");

    if (seller.status !== 'APPROVED')
      throw new UnauthorizedException("Seller not approved yet");

    const isMatch = await bcrypt.compare(password, seller.password);

    if (!isMatch)
      throw new UnauthorizedException("Invalid credentials");

    return {
      accessToken: this.jwtService.sign({
        sub: seller._id,
        role: 'SELLER'
      }, {
        secret: process.env.JWT_SECRET,
      })
    };
  }
}