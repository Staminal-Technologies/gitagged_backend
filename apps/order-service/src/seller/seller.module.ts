import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Seller, SellerSchema } from './schema/seller.schema';
import { User, UserSchema } from '../common/schema/user.schema';
import { SellerController } from './seller.controller';
import { SellerService } from './seller.service';
import { SellerJwtStrategy } from '../seller-auth/seller-jwt.strategy';
import { MailModule } from '../common/mail/mail.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: Seller.name, schema: SellerSchema },
      { name: User.name, schema: UserSchema },
    ]),
    MailModule,
  ],
  controllers: [SellerController],
  providers: [SellerService, SellerJwtStrategy],
})
export class SellerModule { }