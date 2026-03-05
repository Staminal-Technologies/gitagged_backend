import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Product, ProductSchema } from './schema/product.schema';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { Category, CategorySchema } from '../categories/schema/category.schema';
import { SellerJwtStrategy } from 'apps/order-service/src/seller-auth/seller-jwt.strategy';
import { Seller, SellerSchema } from 'apps/order-service/src/seller/schema/seller.schema';
import { PassportModule } from '@nestjs/passport';

@Module({
    imports: [
        PassportModule,
        MongooseModule.forFeature([ 
            { name: Product.name, schema: ProductSchema },
              { name: Category.name, schema: CategorySchema }, 
              { name: Seller.name, schema: SellerSchema }
        ]), 
    ],
    controllers: [ProductsController],
    providers: [ProductsService, SellerJwtStrategy],
    exports: [ProductsService],
})
export class ProductsModule { }
