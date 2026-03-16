import { Injectable, BadRequestException, NotFoundException, UnauthorizedException, ForbiddenException } from '@nestjs/common';
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

    async findAll(user: any) {

        if (!user) {
            throw new UnauthorizedException('User not found in request');
        }

        if (user.role === 'ADMIN') {
            return this.productModel.find()
                .populate('categories', 'name').
                populate('giRegions', 'name').lean();
        }

        if (user.role === 'SELLER') {
            return this.productModel.find({ sellerId: user.sub })
                .populate('categories', 'name').
                populate('giRegions', 'name').lean();
        }

        return [];
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
    async create(data: any, user: any) {

        if (user.role === 'ADMIN') {
            return this.productModel.create(data);
        }

        if (user.role === 'SELLER') {
            return this.productModel.create({
                ...data,
                sellerId: user.sub,
            });
        }

        throw new UnauthorizedException();
    }

    async update(id: string, data: any, user: any) {

        const product = await this.productModel.findById(id);
        if (!product) throw new NotFoundException();

        if (user.role === 'ADMIN') {
            return this.productModel.findByIdAndUpdate(id, data, { new: true });
        }

        if (user.role === 'SELLER') {

            if (product.sellerId.toString() !== user.sub) {
                throw new ForbiddenException('Not your product');
            }

            return this.productModel.findByIdAndUpdate(id, data, { new: true });
        }
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

    async remove(id: string, user: any) {

        const product = await this.productModel.findById(id);
        if (!product) throw new NotFoundException();

        if (user.role === 'ADMIN') {
            return this.productModel.findByIdAndDelete(id);
        }

        if (user.role === 'SELLER') {

            if (product.sellerId.toString() !== user.sub) {
                throw new ForbiddenException('Not your product');
            }

            return this.productModel.findByIdAndDelete(id);
        }
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

    async reduceStock(productId: string, qty: number) {
        const product = await this.productModel.findById(productId);
        if (!product) throw new NotFoundException('Product not found');
        if (product.stock < qty) throw new BadRequestException('Insufficient stock');

        product.stock -= qty;
        return product.save();
    }

    async restoreStock(productId: string, qty: number) {
        return this.productModel.findByIdAndUpdate(
            productId,
            { $inc: { stock: qty } },
            { new: true },
        );
    }

    async getSellerProducts(sellerId: string) {
        return this.productModel.find({ sellerId }).populate('categories').populate('giRegions');
    }

}