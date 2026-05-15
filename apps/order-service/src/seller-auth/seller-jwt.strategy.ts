// import { Injectable, UnauthorizedException } from '@nestjs/common';
// import { PassportStrategy } from '@nestjs/passport';
// import { ExtractJwt, Strategy } from 'passport-jwt';
// import { InjectModel } from '@nestjs/mongoose';
// import { Model } from 'mongoose';
// import { Seller, SellerDocument } from '../seller/schema/seller.schema';

// @Injectable()
// export class SellerJwtStrategy extends PassportStrategy(
//   Strategy,
//   'seller-jwt',
// ) {
//   constructor(
//     @InjectModel(Seller.name)
//     private readonly sellerModel: Model<SellerDocument>,
//   ) {
//     super({
//       jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
//       secretOrKey: process.env.JWT_SECRET,
//     });
//   }

//   async validate(payload: any) {
//     const seller = await this.sellerModel.findOne({
//       userId: payload.sub,
//     }).lean();

//     if (!seller) {
//       throw new UnauthorizedException('Seller not found');
//     }

//     return {
//       sub: seller.userId,
//       sellerId: seller._id,
//       email: seller.email,
//       role: 'SELLER',
//     };
//   }
// }

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';

import { Seller, SellerDocument } from '../seller/schema/seller.schema';

@Injectable()
export class SellerJwtStrategy extends PassportStrategy(
  Strategy,
  'seller-jwt',
) {
  constructor(
    @InjectModel(Seller.name)
    private readonly sellerModel: Model<SellerDocument>,
    private configService: ConfigService,
  ) {

    console.log(
      'SELLER JWT SECRET:',
      configService.get('JWT_SECRET'),
    );

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any) {

    console.log('SELLER TOKEN PAYLOAD:', payload);

    const seller = await this.sellerModel.findById(payload.sub).lean();

    if (!seller) {
      throw new UnauthorizedException('Seller not found');
    }

    return {
      sub: seller.userId,
      sellerId: seller._id,
      email: seller.email,
      role: 'SELLER',
    };
  }
}