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

        if (quantity <= 0) {
            throw new BadRequestException('Quantity must be greater than 0');
        }
        const uId = new Types.ObjectId(userId);
        const pId = new Types.ObjectId(productId);

        const product = await this.productModel.findById(pId).select('stock price sellerId');
        if (!product) throw new NotFoundException('Product not found');
        if (product.stock <= 0) {
            throw new BadRequestException('Product is out of stock');
        }

        let cart = await this.cartModel.findOne({ userId: uId });

        // 🆕 Create cart
        if (!cart) {
            if (quantity > product.stock) {
                throw new BadRequestException(
                    `Only ${product.stock} items available`,
                );
            }

            return this.cartModel.create({
                userId: uId,
                items: [
                    {
                        productId: pId,
                        sellerId: product.sellerId,
                        quantity,
                        price: product.price,
                    },
                ],
            });
        }

        const existingItem = cart.items.find(
            (item) => item.productId.toString() === pId.toString(),
        );

        if (existingItem) {
            const newQty = existingItem.quantity + quantity;

            if (newQty > product.stock) {
                throw new BadRequestException(
                    `Only ${product.stock} items available`,
                );
            }

            existingItem.quantity = newQty;
        } else {
            if (quantity > product.stock) {
                throw new BadRequestException(
                    `Only ${product.stock} items available`,
                );
            }

            cart.items.push({
                productId: pId,
                sellerId: product.sellerId,
                quantity,
                price: product.price,
            });
        }

        return cart.save();
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
        if (quantity <= 0) {
            throw new BadRequestException('Quantity must be greater than 0');
        }
        const uId = new Types.ObjectId(userId);
        const pId = new Types.ObjectId(productId);

        const cart = await this.cartModel.findOne({ userId: uId });
        if (!cart) throw new NotFoundException('Cart not found');

        const item = cart.items.find(
            (i) => i.productId.toString() === pId.toString(),
        );

        if (!item) throw new NotFoundException('Item not found');

        // item.quantity = quantity;
        const product = await this.productModel
            .findById(pId)
            .select('stock');

        if (!product) throw new NotFoundException('Product not found');

        if (product.stock <= 0) {
            throw new BadRequestException('Product is out of stock');
        }

        if (quantity > product.stock) {
            throw new BadRequestException(
                `Only ${product.stock} items available`,
            );
        }

        item.quantity = quantity;

        return cart.save();
    }

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

}
