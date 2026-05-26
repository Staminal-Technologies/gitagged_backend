import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { NotifyController } from './notify.controller';
import { NotifyService } from './notify.service';

import { StockNotify, StockNotifySchema } from './schema/notify.schema';

import { Product, ProductSchema } from '../products/schema/product.schema';

import { ProductBatch, ProductBatchSchema, } from '../products/schema/product-batch.schema';

import { Seller, SellerSchema, } from 'apps/order-service/src/seller/schema/seller.schema';

import { MailModule } from '../common/mail/mail.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            {
                name: StockNotify.name,
                schema: StockNotifySchema,
            },
            {
                name: Product.name,
                schema: ProductSchema,
            },
            {
                name: ProductBatch.name,
                schema: ProductBatchSchema,
            },
            {
                name: Seller.name,
                schema: SellerSchema,
            },
            {
                name: StockNotify.name,
                schema: StockNotifySchema,
            },
        ]),
        MailModule,
    ],

    controllers: [NotifyController],

    providers: [NotifyService],

    exports: [NotifyService],
})
export class NotifyModule { }