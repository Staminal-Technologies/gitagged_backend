import {
    Controller,
    Post,
    Get,
    Body,
    UseGuards,
    Req,
    Param,
    Delete,
    Put,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { UserJwtGuard } from '../common/guards/user-jwt.guard';

@Controller('cart')
@UseGuards(UserJwtGuard)
export class CartController {
    constructor(private readonly cartService: CartService) { }

    @Post('add')
    addToCart(
        @Req() req,
        @Body() body: { productId: string; quantity: number; },
    ) {
        return this.cartService.addToCart(
            req.user.sub,
            body.productId,
            body.quantity,
        );
    }

    @Get()
    getMyCart(@Req() req) {
        return this.cartService.getUserCart(req.user.sub);
    }

    // Clear cart
    @Delete('clear/all')
    clearCart(@Req() req) {
        return this.cartService.clearCart(req.user.sub);
    }

    @Put(':productId')
    updateQty(
        @Req() req,
        @Param('productId') productId: string,
        @Body('quantity') quantity: number,
    ) {
        return this.cartService.updateQuantity(req.user.sub, productId, quantity);
    }

    @Delete(':productId')
    remove(
        @Req() req,
        @Param('productId') productId: string,
    ) {
        return this.cartService.removeItem(
            req.user.sub,
            productId,
        );
    }

}