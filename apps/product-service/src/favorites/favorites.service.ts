import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Favorite, FavoriteDocument } from './schema/favorites.schema';

@Injectable()
export class FavoritesService {
    constructor(
        @InjectModel(Favorite.name)
        private favoriteModel: Model<FavoriteDocument>,
    ) { }

    async add(userId: string, productId: string, variants: string[] = []) {
        const normalize = (arr: string[]) => arr.slice().sort();
        const normalizeVariants = normalize(variants);

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
                select: 'title images categories giRegions variants',
            })
            .lean();

        return {
            items: data.filter(fav => {
                const product = fav.productId as any;
                if (!product) return false;

                const normalize = (arr: string[]) => arr.slice().sort().join('-');

                const v = product?.variants?.find(v =>
                    normalize(v.values) === normalize(fav.variants || [])
                ) || product?.variants?.[0];

                if (!v) return false;

                const now = new Date();
                const bufferDate = new Date();
                bufferDate.setDate(now.getDate() + 10);

                if (v.expiryDate && new Date(v.expiryDate) < bufferDate) {
                    return false;
                }

                return true;
            }).map(fav => {
                const product = fav.productId as any;
                if (!product) return null;

                const normalize = (arr: string[]) => arr.slice().sort().join('-');

                const v = product?.variants?.find(v =>
                    normalize(v.values) === normalize(fav.variants || [])
                ) || product?.variants?.[0];
                if (!v) return null;

                const originalPrice = v?.price || 0;
                const discount = v?.discountPercentage || 0;

                const finalPrice =
                    originalPrice - (originalPrice * discount) / 100;

                return {
                    id: product?._id,
                    title: product?.title,
                    image: product?.images?.[0] || '',
                    price: finalPrice,
                    originalPrice,
                    discount,
                    stock: v?.stock || 0,
                    inStock: (v?.stock || 0) > 0,
                    categories: product?.categories,
                    giRegions: product?.giRegions,
                    variant: fav.variants || [],
                };
            }).filter(Boolean)
        };
    }

    async remove(
        userId: string,
        productId: string,
        variants: string[] = []
    ): Promise<{ deletedCount?: number }> {
        const normalize = (arr: string[]) => arr.slice().sort();
        const normalizedVariants = normalize(variants);

        return this.favoriteModel.deleteOne({
            userId: new Types.ObjectId(userId),
            productId: new Types.ObjectId(productId),
            variants: { $all: normalizedVariants, $size: normalizedVariants.length }
        });
    }

    async mergeGuestFavorites(
        userId: string,
        guestFavourites: { productId: string, variants: string[] }[],
    ) {
        const uId = new Types.ObjectId(userId);

        for (const { productId, variants } of guestFavourites) {
            // Validate productId before converting
            if (!Types.ObjectId.isValid(productId)) {
                console.log(`Skipping invalid productId: ${productId}`);
                continue;
            }
            const pId = new Types.ObjectId(productId);

            const normalize = (arr: string[]) => arr.slice().sort();
            const normalizedVariants = normalize(variants);

            const exists = await this.favoriteModel.findOne({
                userId: uId,
                productId: pId,
                variants: { $all: normalizedVariants, $size: normalizedVariants.length }
            });

            if (!exists) {
                await this.favoriteModel.create({
                    userId: uId,
                    productId: pId,
                    variants: normalizedVariants,
                });
            }
        }
    }

}