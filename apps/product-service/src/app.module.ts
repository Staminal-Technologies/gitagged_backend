import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CategoriesModule } from './categories/categories.module';
import { GIRegionsModule } from './gi-regions/gi-regions.module';
import { ProductsModule } from './products/products.module';


@Module({
    imports: [
        MongooseModule.forRoot('mongodb://localhost:27017/gi-product-db'),
        CategoriesModule,
        GIRegionsModule,
        ProductsModule
    ],
})
export class AppModule { }
