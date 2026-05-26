import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { UserJwtGuard } from "../common/guards/user-jwt.guard";
import { StockNotify, StockNotifyDocument } from './schema/notify.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Controller()
export class NotifyController {

    constructor(
        @InjectModel(StockNotify.name)
        private readonly stockNotifyModel: Model<StockNotifyDocument>) { }

    @UseGuards(UserJwtGuard)
    @Post('notify')
    async notifyMe(@Body() body: { productId: string, variantValues?: string[] }, @Req() req) {
        const sortedVariants =
            body.variantValues?.length
                ? [...body.variantValues].sort()
                : ['default'];

        const existing =
            await this.stockNotifyModel.findOne({
                userId: req.user.sub,
                productId: body.productId,
                variantValues: sortedVariants,
                isNotified: false,
            });

        if (existing) {
            return {
                message: 'Already subscribed for notification',
            };
        }

        return this.stockNotifyModel.create({
            userId: req.user.sub,
            productId: body.productId,
            variantValues: sortedVariants,
        });
    }

}