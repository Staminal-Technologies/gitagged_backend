import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cart, CartDocument } from './schema/cart.schema';
import { Product, ProductDocument } from '../products/schema/product.schema';

@Injectable()
export class CartService {

    private normalize(arr: string[]) {
        return arr.slice().sort().join('-');
    }

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
        variantValues: string[],
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

        const product = await this.productModel.findById(pId).select('sellerId variants');

        if (!product) throw new NotFoundException('Product not found');

        const selectedVariant = product.variants.find(v =>
            this.normalize(v.values) === this.normalize(variantValues)
        );

        if (!selectedVariant) {
            throw new BadRequestException('Variant not found');
        }

        // 🔥 EXPIRY CHECK
        if (selectedVariant.expiryDate && new Date(selectedVariant.expiryDate) < new Date()) {
            throw new BadRequestException('Product is expired');
        }

        if (selectedVariant.stock <= 0) {
            throw new BadRequestException('Product is out of stock');
        }

        let cart = await this.cartModel.findOne({ userId: uId });

        const discount = selectedVariant.discountPercentage || 0;

        const finalPrice =
            selectedVariant.price -
            (selectedVariant.price * discount) / 100;

        variantValues = variantValues.slice().sort();

        // 🆕 Create cart
        if (!cart) {
            if (quantity > selectedVariant.stock) {
                throw new BadRequestException(
                    `Only ${selectedVariant.stock} items available`,
                );
            }

            return this.cartModel.create({
                userId: uId,
                items: [
                    {
                        productId: pId,
                        sellerId: product.sellerId,
                        variant: variantValues,
                        quantity,
                        price: finalPrice,
                        originalPrice: selectedVariant.price,
                        discount: discount,
                    },
                ],
            });
        }

        const existingItem = cart.items.find(
            (item) => item.productId.toString() === pId.toString() && this.normalize(item.variant) === this.normalize(variantValues)
        );

        if (existingItem) {
            const newQty = existingItem.quantity + quantity;

            if (newQty > selectedVariant.stock) {
                throw new BadRequestException(
                    `Only ${selectedVariant.stock} items available`,
                );
            }

            existingItem.quantity = newQty;
        } else {
            if (quantity > selectedVariant.stock) {
                throw new BadRequestException(
                    `Only ${selectedVariant.stock} items available`,
                );
            }

            cart.items.push({
                productId: pId,
                sellerId: product.sellerId,
                variant: variantValues,
                quantity,
                price: finalPrice,
                originalPrice: selectedVariant.price,
                discount: discount,
            });
        }

        return cart.save();
    }

    // Get user cart
    async getUserCart(userId: string) {
        const uId = new Types.ObjectId(userId);

        return this.cartModel
            .findOne({ userId: uId })
            .populate('items.productId')
            .lean()
            .then(cart => {
                if (!cart) return { items: [] };
                return {
                    items: cart.items
                        .filter((item: any) => {
                            const product = item.productId;

                            const variant = product?.variants?.find((v: any) =>
                                this.normalize(v.values) === this.normalize(item.variant || [])
                            );

                            if (!variant) return false;

                            if (
                                variant.expiryDate &&
                                new Date(variant.expiryDate) < new Date()
                            ) {
                                return false;
                            }

                            return true;
                        })
                        .map((item: any) => ({
                            ...item,
                            productId: item.productId
                        }))
                };
            });
    }

    // Update quantity
    async updateQuantity(
        userId: string,
        productId: string,
        variantValues: string[],
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
            (i) => i.productId.toString() === pId.toString() && this.normalize(i.variant) === this.normalize(variantValues)
        );

        if (!item) throw new NotFoundException('Item not found');

        const product = await this.productModel.findById(pId);

        if (!product) throw new NotFoundException('Product not found');

        variantValues = variantValues.slice().sort();

        const selectedVariant = product.variants.find(v =>
            this.normalize(v.values) === this.normalize(variantValues)
        );

        if (!selectedVariant) {
            throw new BadRequestException('Variant not found');
        }

        if (selectedVariant.expiryDate && new Date(selectedVariant.expiryDate) < new Date()) {
            throw new BadRequestException('Product is expired');
        }

        if (quantity > selectedVariant.stock) {
            throw new BadRequestException(
                `Only ${selectedVariant.stock} items available`
            );
        }

        item.quantity = quantity;

        return cart.save();
    }

    // Remove item.
    async removeItem(userId: string, productId: string, variantValues: string[]) {
        const uId = new Types.ObjectId(userId);
        const pId = new Types.ObjectId(productId);

        const cart = await this.cartModel.findOne({ userId: uId });
        if (!cart) throw new NotFoundException('Cart not found');

        cart.items = cart.items.filter(
            item => item.productId.toString() !== pId.toString() || this.normalize(item.variant) !== this.normalize(variantValues)
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
        guestCart: { productId: string; variant: string[]; qty: number }[],
    ) {
        for (const item of guestCart) {
            await this.addToCart(userId, item.productId, item.variant || [], item.qty);
        }
    }

}
