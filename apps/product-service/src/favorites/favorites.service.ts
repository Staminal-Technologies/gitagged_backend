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
            .find({ userId })
            .populate('productId')
            .lean();
    }

    async remove(
        userId: string,
        productId: string,
    ): Promise<{ deletedCount?: number }> {
        return this.favoriteModel.deleteOne({
            userId,
            productId,
        });
    }

}