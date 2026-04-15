import { Body, Controller, Post, Req } from '@nestjs/common';

@Controller()
export class NotifyController {

    constructor(private readonly stockNotifyModel: any) { }

    @Post('notify')
    async notifyMe(@Body() body: { productId: string }, @Req() req) {
        return this.stockNotifyModel.create({
            userId: req.user.sub,
            productId: body.productId,
        });
    }
    
}