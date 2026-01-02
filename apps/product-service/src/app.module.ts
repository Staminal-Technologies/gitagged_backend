import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { CategoriesModule } from './categories/categories.module';
import { GIRegionsModule } from './gi-regions/gi-regions.module';
import { ProductsModule } from './products/products.module';
import {AuthModule } from './auth/auth.module';
import {AdminAuthModule } from './admin-auth/admin-auth.module';
import {UsersModule} from './users/users.module';


@Module({
  imports: [
    // 👇 THIS LOADS .env
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: 'apps/product-service/.env',
    }),

    // 👇 THIS READS MONGODB_URI
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGODB_URI'),
      }),
    }),

    ProductsModule,
    CategoriesModule,
    GIRegionsModule,
    AdminAuthModule,
    AuthModule,
    UsersModule,
  ],
})
export class AppModule { }
