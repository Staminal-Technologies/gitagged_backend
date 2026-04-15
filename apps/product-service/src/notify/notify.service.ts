import { Injectable } from "@nestjs/common";
import { MailService } from "../common/mail/mail.service";

@Injectable()
export class NotifyService {

    constructor(private readonly stockNotifyModel: any,
        private readonly notificationModel: any,
        private readonly productModel: any,
        private readonly mailService: MailService,
    ) { }

    async updateStock(productId: string, newStock: number) {
        const oldProduct = await this.productModel.findById(productId);

        if (!oldProduct) throw new Error('Product not found');

        const product = await this.productModel.findByIdAndUpdate(
            productId,
            { stock: newStock },
            { new: true }
        );

        // ✅ ONLY when stock goes 0 → >0
        if (oldProduct.stock === 0 && newStock > 0) {
            await this.notifyUsers(productId, product.title);
        }

        return product;
    }

    async notifyUsers(productId: string, title: string) {
        const requests = await this.stockNotifyModel.find({
            productId,
            isNotified: false,
        }).populate('userId');

        await Promise.all(
            requests.map(async (req) => {
                try{
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
            } catch(error){
                console.error(`Failed to notify user ${req.userId} for product ${productId}:`, error);
            }
            })
        );
    }
}