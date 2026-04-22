import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cart, CartDocument } from './schema/cart.schema';
import { Product, ProductDocument } from '../products/schema/product.schema';
import { ProductBatch, ProductBatchDocument } from '../products/schema/product-batch.schema';

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
        @InjectModel(ProductBatch.name)
        private productBatchModel: Model<ProductBatchDocument>,
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

        const product = await this.productModel.findById(pId).select('sellerId variants status approveStatus');

        if (!product) throw new NotFoundException('Product not found');
        if (product.status !== 'active' || product.approveStatus !== 'APPROVED') {
            throw new BadRequestException('Product not available');
        }

        const normalizeArr = (arr: string[]) => arr.slice().sort();
        variantValues = normalizeArr(
            variantValues.length ? variantValues : ['default']
        );

        const selectedVariant = product.variants.find(v =>
            this.normalize(v.values) === this.normalize(variantValues)
        );

        if (!selectedVariant) {
            throw new BadRequestException('Variant not found');
        }

        // 🔥 FIND BATCH (MOST IMPORTANT)
        const now = new Date();
        const bufferDate = new Date();
        bufferDate.setDate(now.getDate() + 10);

        const batch = await this.productBatchModel.find({
            productId: pId,
            variantValues,
            stock: { $gt: 0 },
            $or: [
                { expiryDate: null },
                { expiryDate: { $gte: bufferDate } }
            ]
        }).sort({ expiryDate: 1 });

        if (!batch || batch.length === 0) {
            throw new BadRequestException('Product not available');
        }

        // 🔥 STOCK CHECK
        const totalStock = batch.reduce((sum, b) => sum + b.stock, 0);
        if (quantity > totalStock) {
            throw new BadRequestException(`Only ${totalStock} available`);
        }

        const firstBatch = batch[0];

        // 🔥 PRICE
        const originalPrice = firstBatch.priceOverride ?? selectedVariant.price ?? 0;
        const discount = firstBatch.discountPercentageOverride ?? selectedVariant.discountPercentage ?? 0;

        const finalPrice =
            originalPrice - (originalPrice * discount) / 100;

        let cart = await this.cartModel.findOne({ userId: uId });

        variantValues = variantValues.slice().sort();

        // 🆕 Create cart
        if (!cart) {

            return this.cartModel.create({
                userId: uId,
                items: [
                    {
                        productId: pId,
                        sellerId: product.sellerId,
                        variant: variantValues,
                        quantity,
                        price: finalPrice,
                        originalPrice: originalPrice,
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

            if (newQty > totalStock) {
                throw new BadRequestException(
                    `Only ${totalStock} items available`,
                );
            }

            existingItem.quantity = newQty;
        } else {
            if (quantity > totalStock) {
                throw new BadRequestException(
                    `Only ${totalStock} items available`,
                );
            }

            cart.items.push({
                productId: pId,
                sellerId: product.sellerId,
                variant: variantValues,
                quantity,
                price: finalPrice,
                originalPrice: originalPrice,
                discount: discount,
            });
        }

        return cart.save();
    }

    // Get user cart
    async getUserCart(userId: string) {
        const uId = new Types.ObjectId(userId);

        const cart = await this.cartModel
            .findOne({ userId: uId })
            .populate('items.productId')
            .lean();

        if (!cart) return { items: [] };

        const normalizeKey = (arr: string[]) => arr.slice().sort().join('-');

        const bufferDate = new Date();
        bufferDate.setDate(bufferDate.getDate() + 10);

        const productIds = [
            ...new Set(
                cart.items
                    .filter(item => item.productId && item.productId._id)
                    .map(item => item.productId._id.toString())
            )
        ].map(id => new Types.ObjectId(id));

        const batches = await this.productBatchModel.find({
            productId: { $in: productIds },
            stock: { $gt: 0 },
            $or: [
                { expiryDate: null },
                { expiryDate: { $gte: bufferDate } }
            ]
        }).lean();

        const batchMap = new Map();

        for (const b of batches) {
            const key = `${b.productId}-${b.variantValues.sort().join('-')}`;

            if (!batchMap.has(key) ||
                (b.expiryDate && b.expiryDate < batchMap.get(key).expiryDate)) {
                batchMap.set(key, b);
            }
        }

        const filteredItems = [];

        for (const item of cart.items) {
            const product = item.productId as any;

            if (!product || product.status !== 'active' || product.approveStatus !== 'APPROVED') {
                continue;
            }

            const variantKey = normalizeKey(item.variant);

            const mapKey = `${product._id}-${variantKey}`;

            const batch = batchMap.get(mapKey);

            if (!batch) {
                filteredItems.push({
                    ...item,
                    unavailable: true,
                    inStock: false
                });
                continue;
            }

            const selectedVariant = product.variants.find(v =>
                normalizeKey(v.values) === variantKey
            );

            if (!selectedVariant) {
                filteredItems.push({
                    ...item,
                    unavailable: true,
                    inStock: false
                });
                continue;
            }

            const originalPrice = batch.priceOverride ?? selectedVariant?.price ?? 0;
            const discount = batch.discountPercentageOverride ?? selectedVariant?.discountPercentage ?? 0;

            const finalPrice = originalPrice - (originalPrice * discount) / 100;

            filteredItems.push({
                ...item,
                price: finalPrice,
                originalPrice,
                discount,
                inStock: true,
                productId: item.productId
            });
        }

        return { items: filteredItems };
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

        if (!product || product.status !== 'active' || product.approveStatus !== 'APPROVED') {
            throw new BadRequestException('Product not available');
        }
        const normalizeArr = (arr: string[]) => arr.slice().sort();
        variantValues = normalizeArr(
            variantValues.length ? variantValues : ['default']
        );
        const selectedVariant = product.variants.find(v =>
            this.normalize(v.values) === this.normalize(variantValues)
        );

        if (!selectedVariant) {
            throw new BadRequestException('Variant not found');
        }

        const batch = await this.productBatchModel.find({
            productId: pId,
            variantValues,
            stock: { $gt: 0 },
            $or: [
                { expiryDate: null },
                { expiryDate: { $gte: new Date(new Date().setDate(new Date().getDate() + 10)) } }
            ]
        }).sort({ expiryDate: 1 });

        if (!batch || batch.length === 0) throw new BadRequestException('Product not available');

        const totalStock = batch.reduce((sum, b) => sum + b.stock, 0);

        if (quantity > totalStock) {
            throw new BadRequestException(`Only ${totalStock} items available`);
        }

        item.quantity = quantity;

        return cart.save();
    }

    // Remove item.
    async removeItem(userId: string, productId: string, variantValues: string[]) {
        const uId = new Types.ObjectId(userId);
        const pId = new Types.ObjectId(productId);

        const normalizeArr = (arr: string[]) => arr.slice().sort();

        variantValues = normalizeArr(
            variantValues.length ? variantValues : ['default']
        );

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
