import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from '../common/strategies/jwt.strategy';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AdminAuthModule } from 'apps/product-service/src/admin-auth/admin-auth.module';
import { AdminOrdersController } from './admin-order.controller';
import { Order, OrderSchema } from './schema/order.schema';
import { User, UserSchema } from 'apps/product-service/src/users/schema/users.schema';


@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: User.name, schema: UserSchema },
    ]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('USER_JWT_SECRET'),
      }),
    }),
    HttpModule,
    AdminAuthModule,
  ],
  controllers: [OrderController, AdminOrdersController],
  providers: [OrderService, JwtStrategy],
})
export class OrderModule { }
