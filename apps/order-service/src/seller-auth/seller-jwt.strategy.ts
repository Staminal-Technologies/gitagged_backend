import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Seller, SellerDocument } from '../seller/schema/seller.schema';

@Injectable()
export class SellerJwtStrategy extends PassportStrategy(
  Strategy,
  'seller-jwt',
) {
  constructor(
    @InjectModel(Seller.name)
    private readonly sellerModel: Model<SellerDocument>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.SELLER_JWT_SECRET,
    });
  }

  async validate(payload: any) {
    const seller = await this.sellerModel.findById(payload.sub).lean();

    if (!seller) {
      throw new UnauthorizedException('Seller not found');
    }

    return {
      sub: seller._id,
      email: seller.email,
      role: 'seller',
    };
  }
}