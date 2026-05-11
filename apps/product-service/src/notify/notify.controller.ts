import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { UserJwtGuard } from "../common/guards/user-jwt.guard";
@Controller()
export class NotifyController {

    constructor(private readonly stockNotifyModel: any) { }

    @UseGuards(UserJwtGuard)
    @Post('notify')
    async notifyMe(@Body() body: { productId: string, variantValues?: string[] }, @Req() req) {
        return this.stockNotifyModel.create({
            userId: req.user.sub,
            productId: body.productId,
            variantValues: body.variantValues || [],
        });
    }

}