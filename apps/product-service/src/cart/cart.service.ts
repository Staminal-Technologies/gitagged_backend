import { Injectable , BadRequestException} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cart, CartDocument } from './schema/cart.schema';

@Injectable()
export class CartService {
    constructor(
        @InjectModel(Cart.name)
        private cartModel: Model<CartDocument>,
    ) { }

    // Add or update cart item
    async addToCart(
        userId: string,
        productId: string,
        quantity: number,
        price: number,
    ) {
        if (!Types.ObjectId.isValid(productId)) {
            throw new BadRequestException('Invalid productId');
        }
        const uId = new Types.ObjectId(userId);
        const pId = new Types.ObjectId(productId);
        const existing = await this.cartModel.findOne({
            userId: uId,
            productId: pId,
        });

        if (existing) {
            existing.quantity += quantity;
            return existing.save();
        }

        return this.cartModel.create({
            userId: uId,
            productId : pId,
            quantity,
            price,
        });
    }

    // Get user cart
    async getUserCart(userId: string) {
        const uId = new Types.ObjectId(userId);
        return this.cartModel
            .find({ userId: uId })
            .populate('productId')
            .lean();
    }

    // Update quantity
    async updateQuantity(cartId: string, quantity: number) {
        return this.cartModel.findByIdAndUpdate(
            cartId,
            { quantity },
            { new: true },
        );
    }

    // Remove item
    async removeItem(cartId: string) {
        return this.cartModel.findByIdAndDelete(cartId);
    }

    // Clear cart
    async clearCart(userId: string): Promise<{ deletedCount?: number }> {
        const uId = new Types.ObjectId(userId);
        return this.cartModel.deleteMany({ userId: uId });
    }
}
