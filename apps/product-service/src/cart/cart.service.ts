import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cart, CartDocument } from './schema/cart.schema';
import { Product, ProductDocument } from '../products/schema/product.schema';

@Injectable()
export class CartService {
    constructor(
        @InjectModel(Cart.name)
        private cartModel: Model<CartDocument>,
        @InjectModel(Product.name)
        private productModel: Model<ProductDocument>,
    ) { }

    // Add or update cart item
    async addToCart(
        userId: string,
        productId: string,
        quantity: number,
    ) {
        if (!Types.ObjectId.isValid(productId)) {
            throw new BadRequestException('Invalid productId');
        }
        const uId = new Types.ObjectId(userId);
        const pId = new Types.ObjectId(productId);

        const product = await this.productModel.findById(pId);
        if (!product) throw new NotFoundException('Product not found');

        const sellerId = product.sellerId;
        let cart = await this.cartModel.findOne({ userId: uId });

        // 🆕 Create cart if not exists
        if (!cart) {
            return this.cartModel.create({
                userId: uId,
                items: [
                    {
                        productId: pId,
                        sellerId,
                        quantity,
                        price: product.price,
                    },
                ],
            });
        }

        // 🔍 Check if item exists
        const existingItem = cart.items.find(
            (item) => item.productId.toString() === pId.toString(),
        );

        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cart.items.push({
                productId: pId,
                sellerId,
                quantity,
                price: product.price,
            });
        }

        return cart.save();
        // const existing = await this.cartModel.findOne({
        //     userId: uId,
        //     productId: pId,
        // });

        // if (existing) {
        //     existing.quantity += quantity;
        //     return existing.save();
        // }

        // return this.cartModel.create({
        //     userId: uId,
        //     productId: pId,
        //     quantity,
        //     price,
        // });
    }

    // Get user cart
    async getUserCart(userId: string) {
        const uId = new Types.ObjectId(userId);
        return this.cartModel
            .find({ userId: uId })
            .populate('items.productId')
            .lean();
    }

    // Update quantity
    async updateQuantity(
        userId: string,
        productId: string,
        quantity: number,
    ) {
        const uId = new Types.ObjectId(userId);
        const pId = new Types.ObjectId(productId);

        const cart = await this.cartModel.findOne({ userId: uId });
        if (!cart) throw new NotFoundException('Cart not found');

        const item = cart.items.find(
            (i) => i.productId.toString() === pId.toString(),
        );

        if (!item) throw new NotFoundException('Item not found');

        item.quantity = quantity;

        return cart.save();
    }
    // async updateQuantity(cartId: string, quantity: number) {
    //     return this.cartModel.findByIdAndUpdate(
    //         cartId,
    //         { quantity },
    //         { new: true },
    //     );
    // }

    // Remove item.
    async removeItem(userId: string, productId: string) {
    const uId = new Types.ObjectId(userId);
    const pId = new Types.ObjectId(productId);

    const cart = await this.cartModel.findOne({ userId: uId });
    if (!cart) throw new NotFoundException('Cart not found');

    cart.items = cart.items.filter(
      (item) => item.productId.toString() !== pId.toString(),
    );

    return cart.save();
  }
    // async removeItem(cartId: string) {
    //     return this.cartModel.findByIdAndDelete(cartId);
    // }

    // Clear cart
    async clearCart(userId: string): Promise<{ deletedCount?: number }> {
        const uId = new Types.ObjectId(userId);
        return this.cartModel.deleteMany({ userId: uId });
    }

     async mergeGuestCart(
    userId: string,
    guestCart: { productId: string; qty: number }[],
  ) {
    for (const item of guestCart) {
      await this.addToCart(userId, item.productId, item.qty);
    }
}
  
    // async mergeGuestCart(
    //     userId: string,
    //     guestCart: { productId: string; qty: number; price: number }[],
    // ) {
    //     const uId = new Types.ObjectId(userId);

    //     for (const item of guestCart) {
    //         const pId = new Types.ObjectId(item.productId);

    //         const existing = await this.cartModel.findOne({
    //             userId: uId,
    //             productId: pId,
    //         });

    //         if (existing) {
    //             existing.quantity += item.qty;
    //             await existing.save();
    //         } else {
    //             await this.cartModel.create({
    //                 userId: uId,
    //                 productId: pId,
    //                 quantity: item.qty,
    //                 price: item.price,
    //             });
    //         }
    //     }
    // }
}
