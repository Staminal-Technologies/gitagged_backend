import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Favorite, FavoriteDocument } from './schema/favorites.schema';
import { ProductBatch, ProductBatchDocument } from '../products/schema/product-batch.schema';
import { Product, ProductDocument } from '../products/schema/product.schema';

@Injectable()
export class FavoritesService {
    constructor(
        @InjectModel(Favorite.name)
        private favoriteModel: Model<FavoriteDocument>,
        @InjectModel(ProductBatch.name)
        private productBatchModel: Model<ProductBatchDocument>,
        @InjectModel(Product.name)
        private productModel: Model<ProductDocument>
    ) { }

    private normalizeVariants(values: string[] = []) {
        return values
            .map(v => v.trim().toLowerCase())
            .sort();
    }

    private variantKey(values: string[] = []) {
        return this.normalizeVariants(values).join('-');
    }

    async add(userId: string, productId: string, variants: string[] = []) {

        const product =
            await this.productModel.findById(productId);

        if (!product) {
            throw new NotFoundException(
                'Product not found'
            );
        }
        if (
            product.approveStatus !== 'APPROVED' ||
            product.status !== 'active'
        ) {
            throw new NotFoundException(
                'Product unavailable'
            );
        }

        const normalize = (arr: string[]) => arr.slice().sort();
        const normalizeVariants =
            normalize(
                variants.length
                    ? variants
                    : ['default']
            );
        const variantKey = normalizeVariants.join('-');

        this.normalizeVariants(variants);

        const variantExists =
            product.variants.some(v =>
                this.variantKey(v.values) ===
                this.variantKey(normalizeVariants)
            );

        if (!variantExists) {
            throw new NotFoundException(
                'Variant not found'
            );
        }
        const exists = await this.favoriteModel.findOne({
            userId: new Types.ObjectId(userId),
            productId: new Types.ObjectId(productId),
            variantKey,
        });

        if (exists) return exists;

        return this.favoriteModel.create({
            userId: new Types.ObjectId(userId),
            productId: new Types.ObjectId(productId),
            variants:normalizeVariants,
            variantKey,
        });
    }

    async getMyFavorites(userId: string) {
        const data = await this.favoriteModel
            .find({ userId: new Types.ObjectId(userId) })
            .populate({
                path: 'productId',
                select: 'title images categories giRegions variants status approveStatus',
            })
            .lean();

        const now = new Date();
        const bufferDate = new Date();
        bufferDate.setDate(now.getDate() + 10);

        const items = [];
        const validData = data.filter(fav => fav.productId);

        const batchQueries = validData.map(fav => ({
            productId: fav.productId?._id,
            variantKey: this.variantKey(
                fav.variants || []
            )
        }));

        const productIds = [...new Set(batchQueries.map(q => q.productId.toString()))]
            .map(id => new Types.ObjectId(id));

        if (!productIds.length) {
            return [];
        }

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
            const key =
                `${b.productId}-${this.variantKey(
                    b.variantValues
                )}`;
            if (!batchMap.has(key) || (b.expiryDate && b.expiryDate < batchMap.get(key).expiryDate)) {
                batchMap.set(key, b);
            }
        }

        for (const fav of data) {
            const product = fav.productId as any;
            if (!product || product.status !== 'active' || product.approveStatus !== 'APPROVED') continue;

            const variantKey =
                this.variantKey(
                    fav.variants?.length
                        ? fav.variants
                        : ['default']
                ); const v = product.variants.find(v => this.variantKey(v.values) === variantKey);

            if (!v) {
                items.push({
                    id: product._id,
                    title: product.title,
                    image: product.images?.[0] || '',
                    price: 0,
                    originalPrice: 0,
                    discount: 0,
                    stock: 0,
                    inStock: false,
                    unavailable: true,
                    categories: product.categories,
                    giRegions: product.giRegions,
                    variant: fav.variants,
                });
                continue;
            }

            const image = v.images?.length > 0 ? v.images[0] : product.images?.[0] || '';
            const mapKey = `${product._id}-${variantKey}`;
            const batch = batchMap.get(mapKey);

            if (!batch) {
                items.push({
                    id: product._id,
                    title: product.title,
                    image,
                    price: 0,
                    originalPrice: 0,
                    discount: 0,
                    stock: 0,
                    inStock: false,
                    unavailable: true,
                    categories: product.categories,
                    giRegions: product.giRegions,
                    variant: fav.variants,
                });
                continue;
            }

            const originalPrice = batch.priceOverride ?? v.price ?? 0;
            const discount = batch.discountPercentageOverride ?? v.discountPercentage ?? 0;
            const finalPrice = originalPrice - (originalPrice * discount) / 100;

            items.push({
                id: product._id,
                title: product.title,
                image,
                price: finalPrice,
                originalPrice,
                discount,
                stock: batch.stock,
                inStock: batch.stock > 0,
                categories: product.categories,
                giRegions: product.giRegions,
                variant: fav.variants,
            });
        }

        return items;
    }

    async remove(
        userId: string,
        productId: string,
        variants: string[] = [],): Promise<{ deletedCount?: number }> {

        const normalize = (arr: string[]) =>
            arr.slice().sort();

        const normalizedVariants =
            normalize(
                variants.length
                    ? variants
                    : ['default']
            );

        const variantKey = normalizedVariants.join('-');

        return this.favoriteModel.deleteOne({
            userId: new Types.ObjectId(userId),
            productId: new Types.ObjectId(productId),
            variantKey,
        });
    }

    async mergeGuestFavorites(
        userId: string,
        guestFavourites: { productId: string; variants: string[] }[],
    ) {

        const uId = new Types.ObjectId(userId);

        const normalize = (arr: string[]) =>
            arr.slice().sort();

        const failedItems = [];

        for (const fav of guestFavourites) {

            try {

                if (!Types.ObjectId.isValid(fav.productId)) {
                    console.log(
                        `Skipping invalid productId: ${fav.productId}`
                    );
                    continue;
                }

                const product =
                    await this.productModel.findById(
                        fav.productId
                    );

                // product exists?
                if (!product) {
                    continue;
                }

                // product active + approved?
                if (
                    product.approveStatus !== 'APPROVED' ||
                    product.status !== 'active'
                ) {
                    continue;
                }

                const normalizedVariants =
                    normalize(
                        fav.variants?.length
                            ? fav.variants
                            : ['default']
                    );

                // variant exists?
                const normalizeKey = (arr: string[]) =>
                    arr.slice().sort().join('-');

                const variantExists =
                    product.variants.some(v =>
                        this.variantKey(v.values) ===
                        this.variantKey(normalizedVariants)
                    );

                console.log(
                    'CHECKING VARIANT',
                    fav.productId,
                    normalizedVariants,
                    product.variants.map(v => v.values)
                );

                if (!variantExists) {
                    console.log(
                        '❌ VARIANT NOT FOUND',
                        fav.productId,
                        normalizedVariants
                    );
                    continue;
                }

                const pId =
                    new Types.ObjectId(fav.productId);

                const variantKey = normalizedVariants.join('-');
                const exists =
                    await this.favoriteModel.findOne({
                        userId: uId,
                        productId: pId,
                        variantKey
                    });

                if (!exists) {

                    await this.favoriteModel.create({
                        userId: uId,
                        productId: pId,
                        variants: normalizedVariants,
                        variantKey,
                    });

                    console.log(
                        '✅ FAVORITE MERGED',
                        fav.productId,
                        normalizedVariants
                    );
                }

            } catch (err: any) {

                console.log(
                    '❌ FAVORITE MERGE ERROR',
                    fav.productId,
                    fav.variants,
                    err.message
                );

                failedItems.push({
                    productId: fav.productId,
                    variants: fav.variants,
                    reason: err.message
                });
            }
        }

        return {
            message: 'Favorites merged successfully',
            failedItems
        };
    }
}