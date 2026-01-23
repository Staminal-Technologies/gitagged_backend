import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, ProductDocument } from './schema/product.schema';
import slugify from 'slugify';
import { Category, CategoryDocument } from '../categories/schema/category.schema';
import cloudinary from '../common/cloudinary/cloudinary.config';

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
        return this.productModel.create({
            ...data,
            images: data.images ?? [],
        });
    }

    async update(id: string, data: Partial<Product>) {
        const updateData: any = { ...data };

        // ✅ only update images IF provided
        if (Array.isArray(data.images) && data.images.length > 0) {
            updateData.images = data.images;
        } else {
            delete updateData.images;
        }

        return this.productModel.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true }
        ).lean();
    }

    async updateProductImage(id: string, file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException('Image is required');
        }

        const upload = await cloudinary.uploader.upload(
            `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
            { folder: 'products' },
        );

        return this.productModel.findByIdAndUpdate(
            id,
            {
                $push: {
                    images: upload.secure_url,
                },
            },
            { new: true },
        );
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