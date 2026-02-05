import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { OrderModule } from './order/order.module';
import { AdminAuthModule } from 'apps/product-service/src/admin-auth/admin-auth.module';

@Module({
  imports: [
    // 👇 Load .env for order-service
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: 'apps/order-service/.env',
    }),

    // 👇 Safe MongoDB connection
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGODB_URI'),
      }),
    }),

    OrderModule,
    AdminAuthModule,
  ],
})
export class AppModule {}
