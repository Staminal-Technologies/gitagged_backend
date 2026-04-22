import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Favorite, FavoriteSchema } from './schema/favorites.schema';
import { FavoritesController } from './favorites.controller';
import { FavoritesService } from './favorites.service';
import { ProductBatch, ProductBatchSchema } from '../products/schema/product-batch.schema';
import { Product, ProductSchema } from '../products/schema/product.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Favorite.name, schema: FavoriteSchema },
      { name: ProductBatch.name, schema: ProductBatchSchema },
      { name: Product.name, schema: ProductSchema },
    ]),
  ],
  controllers: [FavoritesController],
  providers: [FavoritesService],
  exports: [FavoritesService],
})
export class FavoritesModule { }
