import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { SellerAuthService } from './seller-auth.service';
import { SellerAuthController } from './seller-auth.controller';
import { Seller, SellerSchema } from '../seller/schema/seller.schema';
import { SellerJwtStrategy } from './seller-jwt.strategy';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Seller.name, schema: SellerSchema }]),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [SellerAuthController],
  providers: [SellerAuthService, SellerJwtStrategy],
})
export class SellerAuthModule {}