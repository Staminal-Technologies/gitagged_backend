import { Injectable } from "@nestjs/common";
import { MailService } from "../common/mail/mail.service";

@Injectable()
export class NotifyService {

    constructor(private readonly stockNotifyModel: any,
        private readonly notificationModel: any,
        private readonly productModel: any,
        private readonly mailService: MailService,
        private readonly productBatchModel: any,
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
            variantValues,
            isNotified: false,
        }).populate('userId');

        await Promise.all(
            requests.map(async (req) => {
                try {
                    const user = req.userId as any;

                    await this.notificationModel.create({
                        userId: user._id,
                        title: 'Back in Stock!',
                        message: `${title} is now available`,
                    });

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