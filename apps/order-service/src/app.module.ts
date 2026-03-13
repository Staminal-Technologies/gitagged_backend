import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { OrderModule } from './order/order.module';
import { AdminAuthModule } from 'apps/product-service/src/admin-auth/admin-auth.module';
import { SellerModule } from './seller/seller.module';
import { SellerAuthModule } from './seller-auth/seller-auth.module';
// import { AuthModule } from '../src/common/auth/auth.module';
import {AuthModule} from 'apps/product-service/src/auth/auth.module';

@Module({
  imports: [
    // 👇 Load .env for order-service
    ConfigModule.forRoot({
      isGlobal: true,
      // envFilePath: '.env',
    }),

    // 👇 Safe MongoDB connection
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGODB_URI'),
      }),
    }),

    AuthModule,
    OrderModule,
    // AdminAuthModule,
    SellerModule,
    SellerAuthModule,
  ],
})
export class AppModule { }
