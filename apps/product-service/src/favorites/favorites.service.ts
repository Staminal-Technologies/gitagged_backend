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

    async add(userId: string, productId: string) {
        return this.favoriteModel.create({
            userId: new Types.ObjectId(userId),
            productId: new Types.ObjectId(productId),
        });
    }

    async getMyFavorites(userId: string) {
        return this.favoriteModel
            .find({ userId: new Types.ObjectId(userId) })
            .populate({
                path: 'productId',
                select: 'title price images categories giRegions',
            })
            .lean();
    }

    async remove(
        userId: string,
        productId: string,
    ): Promise<{ deletedCount?: number }> {
        return this.favoriteModel.deleteOne({
            userId: new Types.ObjectId(userId),
            productId: new Types.ObjectId(productId),
        });
    }

    async mergeGuestFavorites(
        userId: string,
        guestFavourites: string[],
    ) {
        const uId = new Types.ObjectId(userId);

        for (const productId of guestFavourites) {
            // Validate productId before converting
            if (!Types.ObjectId.isValid(productId)) {
                console.log(`Skipping invalid productId: ${productId}`);
                continue;
            }
            const pId = new Types.ObjectId(productId);

            const exists = await this.favoriteModel.findOne({
                userId: uId,
                productId: pId,
            });

            if (!exists) {
                await this.favoriteModel.create({
                    userId: uId,
                    productId: pId,
                });
            }
        }
    }

}