import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { HttpModule } from '@nestjs/axios';
import { AdminAuthModule } from '../common/admin-auth/admin-auth.module';
import { AdminOrdersController } from './admin-order.controller';
import { Order, OrderSchema } from './schema/order.schema';
import { User, UserSchema } from '../common/schema/user.schema';
import { Product, ProductSchema } from '../common/schema/product.schema';
import { AuthModule } from '../common/auth/auth.module';
import { ProductBatchSchema, ProductBatch } from 'apps/product-service/src/products/schema/product-batch.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: User.name, schema: UserSchema },
      {name: Product.name, schema: ProductSchema},
      { name: ProductBatch.name, schema:ProductBatchSchema}
    ]),
    AuthModule,
    HttpModule,
    AdminAuthModule,
  ],
  controllers: [OrderController, AdminOrdersController],
  providers: [OrderService],
})
export class OrderModule { }
