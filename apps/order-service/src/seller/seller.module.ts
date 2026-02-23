import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Seller, SellerSchema } from './schema/seller.schema';
import { User, UserSchema } from 'apps/product-service/src/users/schema/users.schema';
import { SellerController } from './seller.controller';
import { SellerService } from './seller.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Seller.name, schema: SellerSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [SellerController],
  providers: [SellerService],
})
export class SellerModule {}