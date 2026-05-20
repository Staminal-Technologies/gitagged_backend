import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { JwtStrategy } from './jwt.strategy';
import { FirebaseModule } from '../common/firebase/firebase.module';
import { Seller, SellerSchema } from 'apps/order-service/src/seller/schema/seller.schema';
import { Admin, AdminSchema } from '../admin-auth/schema/admin.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { SellerJwtStrategy } from '../strategy/seller-jwt.strategy';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    FirebaseModule,
    ConfigModule,

    MongooseModule.forFeature([
      { name: Admin.name, schema: AdminSchema },
      { name: Seller.name, schema: SellerSchema },
    ]),

    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '7d' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, SellerJwtStrategy],
  exports: [JwtModule, PassportModule],
})
export class AuthModule {}
