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
        @Body() body: { productId: string; quantity: number; price: number },
    ) {
        return this.cartService.addToCart(
            req.user.sub,
            body.productId,
            body.quantity,
            body.price,
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

    @Put(':id')
    updateQty(
        @Param('id') cartId: string,
        @Body('quantity') quantity: number,
    ) {
        return this.cartService.updateQuantity(cartId, quantity);
    }

    @Delete(':id')
    remove(@Param('id') cartId: string) {
        return this.cartService.removeItem(cartId);
    }

}