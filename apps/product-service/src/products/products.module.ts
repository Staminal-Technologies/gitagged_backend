import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Product, ProductSchema } from './schema/product.schema';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { Category, CategorySchema } from '../categories/schema/category.schema';
import { SellerJwtStrategy } from '../strategy/seller-jwt.strategy';
import { Seller, SellerSchema } from '../schema/seller.schema';
import { PassportModule } from '@nestjs/passport';
import { MailModule } from '../common/mail/mail.module';
import { ProductBatch, ProductBatchSchema } from './schema/product-batch.schema';
import { User, UserSchema } from '../users/schema/users.schema';

@Module({
    imports: [
        PassportModule,
        MongooseModule.forFeature([
            { name: Product.name, schema: ProductSchema },
            { name: Category.name, schema: CategorySchema },
            { name: Seller.name, schema: SellerSchema },
            { name: ProductBatch.name, schema: ProductBatchSchema },
            { name: User.name, schema: UserSchema },
        ]),
        MailModule,
    ],
    controllers: [ProductsController],
    providers: [ProductsService, SellerJwtStrategy],
    exports: [ProductsService],
})
export class ProductsModule { }
