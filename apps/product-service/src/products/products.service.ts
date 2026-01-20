import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, ProductDocument } from './schema/product.schema';
import slugify from 'slugify';
import { Category, CategoryDocument } from '../categories/schema/category.schema';

@Injectable()
export class ProductsService {
    constructor(
        @InjectModel(Product.name) private productModel: Model<ProductDocument>,
        @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
    ) { }

    async findAll() {
        return this.productModel.find().lean();
    }

    async findById(id: string) {
        return this.productModel.findById(id).lean();
    }

    async findByCategory(categoryId: string) {
        return this.productModel.find({ categories: categoryId }).lean();
    }

    async findByGIRegion(regionId: string) {
        return this.productModel.find({ giRegions: regionId }).lean();
    }

    async create(data: Partial<Product>) {
        return this.productModel.create(data);
    }

    async update(id: string, data: Partial<Product>) {
        return this.productModel.findByIdAndUpdate(id, data, { new: true }).lean();
    }

    async createSlug(data: any) {
        const slug = slugify(data.title, {
            lower: true,
            strict: true,
        });

        return this.productModel.create({
            ...data,
            slug,
        });
    }

    async remove(id: string) {
        return this.productModel.findByIdAndDelete(id);
    }

    // 🔥 NEW METHOD — FIND BY PARENT CATEGORY
    async findByParentCategory(parentId: string) {
        const categories = await this.categoryModel
            .find({ parentId })
            .select('_id')
            .lean();

        const categoryIds = categories.map(cat => cat._id);

        return this.productModel.find({
            categories: { $in: categoryIds },
        }).lean();
    }
}