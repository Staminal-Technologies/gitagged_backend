import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from 'mongoose';
import { MailService } from "../common/mail/mail.service";
import { StockNotify, StockNotifyDocument, } from './schema/notify.schema';
import { Product, ProductDocument } from '../products/schema/product.schema';
import { ProductBatch, ProductBatchDocument } from '../products/schema/product-batch.schema';

@Injectable()
export class NotifyService {

    constructor(
        @InjectModel(StockNotify.name)
        private readonly stockNotifyModel: Model<StockNotifyDocument>,
        @InjectModel(Product.name)
        private readonly productModel: Model<ProductDocument>,
        private readonly mailService: MailService,
        @InjectModel(ProductBatch.name)
        private readonly productBatchModel: Model<ProductBatchDocument>,
    ) { }

    async updateStock(batchId: string, newStock: number) {
        const batch = await this.productBatchModel.findById(batchId);

        if (!batch) throw new Error('Batch not found');

        const oldStock = batch.stock;
        batch.stock = newStock;

        await batch.save();

        // only when stock returns
        if (oldStock === 0 && newStock > 0) {

            const product = await this.productModel.findById(
                batch.productId
            );

            await this.notifyUsers(
                batch.productId.toString(),
                batch.variantValues || [],
                product.title,
            );
        }

        return batch;
    }

    async notifyUsers(productId: string, variantValues: string[], title: string) {
        const requests = await this.stockNotifyModel.find({
            productId,
            variantValues: variantValues.sort(),
            isNotified: false,
        }).populate('userId');

        await Promise.all(
            requests.map(async (req) => {
                try {
                    const user = req.userId as any;

                    if (user.email) {
                        await this.mailService.sendEmail(
                            user.email,
                            'Product Back in Stock!',
                            `${title} is available now. Hurry!`
                        );
                    }

                    req.isNotified = true;
                    await req.save();
                } catch (error) {
                    console.error(`Failed to notify user ${req.userId} for product ${productId}:`, error);
                }
            })
        );
    }
}