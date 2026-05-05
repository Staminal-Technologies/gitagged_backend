import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Favorite, FavoriteDocument } from './schema/favorites.schema';
import { ProductBatch, ProductBatchDocument } from '../products/schema/product-batch.schema';

@Injectable()
export class FavoritesService {
    constructor(
        @InjectModel(Favorite.name)
        private favoriteModel: Model<FavoriteDocument>,
        @InjectModel(ProductBatch.name)
        private productBatchModel: Model<ProductBatchDocument>,
    ) { }

    async add(userId: string, productId: string, variants: string[] = []) {
        const normalize = (arr: string[]) => arr.slice().sort();
        const normalizeVariants = normalize(variants.length ? variants : ['default']);

        const exists = await this.favoriteModel.findOne({
            userId: new Types.ObjectId(userId),
            productId: new Types.ObjectId(productId),
            variants: { $all: normalizeVariants, $size: normalizeVariants.length }
        });

        if (exists) return exists;

        return this.favoriteModel.create({
            userId: new Types.ObjectId(userId),
            productId: new Types.ObjectId(productId),
            variants: normalizeVariants,
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

        const normalizeKey = (arr: string[]) => arr.slice().sort().join('-');
        const validData = data.filter(fav => fav.productId);
        const batchQueries = validData.map(fav => ({
            productId: fav.productId?._id,
            variantKey: normalizeKey(fav.variants || [])
        }));

        // const productIds = batchQueries.map(q => q.productId);
        const productIds = [...new Set(batchQueries.map(q => q.productId.toString()))]
            .map(id => new Types.ObjectId(id));

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

            // Keep earliest expiry (FEFO)
            if (!batchMap.has(key) ||
                (b.expiryDate && b.expiryDate < batchMap.get(key).expiryDate)) {
                batchMap.set(key, b);
            }
        }

        for (const fav of data) {
            const product = fav.productId as any;
            if (!product || product.status !== 'active' || product.approveStatus !== 'APPROVED') continue;

            const variantKey = normalizeKey(fav.variants?.length ? fav.variants : ['default']);

            const v = product.variants.find(v =>
                normalizeKey(v.values) === variantKey
            );

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
                    variant: variantKey.split('-'),
                });
                continue;
            }

            const image =
                v.images?.length > 0
                    ? v.images[0]
                    : product.images?.[0] || '';

            // 🔥 GET BATCH (IMPORTANT)
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
                    variant: variantKey.split('-'),
                });
                continue;
            }
            // 🔥 PRICE LOGIC
            const originalPrice = batch.priceOverride ?? v.price ?? 0;
            const discount =
                batch.discountPercentageOverride ?? v.discountPercentage ?? 0;

            const finalPrice =
                originalPrice - (originalPrice * discount) / 100;

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
                variant: variantKey.split('-'),
            });
        }

        return items;
    }

    async remove(
        userId: string,
        productId: string,
        variants: string[] = []
    ): Promise<{ deletedCount?: number }> {
        const normalize = (arr: string[]) => arr.slice().sort();
        const normalizedVariants = normalize(variants.length ? variants : ['default']);

        return this.favoriteModel.deleteOne({
            userId: new Types.ObjectId(userId),
            productId: new Types.ObjectId(productId),
            variants: { $all: normalizedVariants, $size: normalizedVariants.length }
        });
    }

    // async mergeGuestFavorites(
    //     userId: string,
    //     guestFavourites: { productId: string, variants: string[] }[],
    // ) {
    //     const uId = new Types.ObjectId(userId);

    //     for (const { productId, variants } of guestFavourites) {
    //         // Validate productId before converting
    //         if (!Types.ObjectId.isValid(productId)) {
    //             console.log(`Skipping invalid productId: ${productId}`);
    //             continue;
    //         }
    //         const pId = new Types.ObjectId(productId);

    //         const normalize = (arr: string[]) => arr.slice().sort();
    //         const normalizedVariants = normalize(variants.length ? variants : ['default']);

    //         const exists = await this.favoriteModel.findOne({
    //             userId: uId,
    //             productId: pId,
    //             variants: { $all: normalizedVariants, $size: normalizedVariants.length }
    //         });

    //         if (!exists) {
    //             await this.favoriteModel.create({
    //                 userId: uId,
    //                 productId: pId,
    //                 variants: normalizedVariants,
    //             });
    //         }
    //     }
    // }

    async mergeGuestFavorites(
        userId: string,
        guestFavourites: { productId: string; variants: string[] }[],
    ) {
        const uId = new Types.ObjectId(userId);

        const normalize = (arr: string[]) => arr.slice().sort();

        for (const fav of guestFavourites) {

            if (!Types.ObjectId.isValid(fav.productId)) {
                console.log(`Skipping invalid productId: ${fav.productId}`);
                continue;
            }

            const pId = new Types.ObjectId(fav.productId);

            const normalizedVariants = normalize(
                fav.variants?.length ? fav.variants : ['default']
            );

            // 🔥 MAIN FIX (NO findOne, NO create)
            await this.favoriteModel.updateOne(
                {
                    userId: uId,
                    productId: pId,
                    variants: normalizedVariants
                },
                {
                    $set: {
                        userId: uId,
                        productId: pId,
                        variants: normalizedVariants
                    }
                },
                {
                    upsert: true
                }
            );
        }
    }

}