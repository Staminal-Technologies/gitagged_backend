import { Injectable, BadRequestException, NotFoundException, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, ProductDocument } from './schema/product.schema';
import slugify from 'slugify';
import { Category, CategoryDocument } from '../categories/schema/category.schema';
import cloudinary from '../common/cloudinary/cloudinary.config';
import { MailService } from '../common/mail/mail.service';
import { ProductApproveStatus } from '../enum/product-approve-status.enum';

@Injectable()
export class ProductsService {
    constructor(
        @InjectModel(Product.name) private productModel: Model<ProductDocument>,
        @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
        private mailService: MailService,
    ) { }

    async findAll(user: any) {

        if (!user || user.role === 'USER') {
            return this.productModel.find({ status: 'active', approveStatus: ProductApproveStatus.APPROVED, })
                .populate('categories', 'name')
                .populate('giRegions', 'name')
                .lean();
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
        const product = await this.productModel.findById(id).lean();

        if (!product || product.status !== 'active') {
            throw new NotFoundException('Product not available');
        }
        return product;
    }

    async findByCategory(categoryId: string) {
        return this.productModel.find({ categories: categoryId, status: 'active' }).lean();
    }

    async findByGIRegion(regionId: string) {
        return this.productModel.find({ giRegions: regionId, status: 'active' }).lean();
    }

    async create(data: any, user: any) {

        if (user.role !== 'SELLER') {
            throw new UnauthorizedException();
        }

        // 🔥 CASE 1: NO VARIANTS (simple product)
        if (!data.variants || data.variants.length === 0) {
            data.variantOptions = [];

            data.variants = [
                {
                    values: ['default'],
                    price: data.price || 0,
                    stock: data.stock || 0,
                    sku: 'DEFAULT'
                }
            ];
        }

        // 🔥 CASE 2: HAS VARIANTS
        else {
            data.variants = data.variants.map((v, index) => ({
                ...v,
                sku: v.sku || `${data.title.substring(0, 3).toUpperCase()}-${index + 1}`
            }));
        }

        const product = await this.productModel.create({
            ...data,
            sellerId: user.sub,
            approveStatus: ProductApproveStatus.PENDING,
        });

        return product;
    }
    // async create(data: any, user: any) {

    //     if (user.role === 'SELLER') {
    //         const product = await this.productModel.create({
    //             ...data,
    //             sellerId: user.sub,
    //             approveStatus: ProductApproveStatus.PENDING,
    //         });

    //         // Send email to admin for approval
    //         await this.mailService.sendProductRequestEmail(product);

    //         return product;

    //     }
    //     throw new UnauthorizedException();
    // }

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

            if (product.isUpdatePending) {
                throw new BadRequestException('Already pending approval');
            }

            product.pendingUpdates = data;
            product.isUpdatePending = true;

            await product.save();

            const fullProduct = await this.productModel
                .findById(product._id)
                .populate('sellerId', 'sellerName email');

            await this.mailService.sendProductUpdateRequestEmail(fullProduct);

            return { message: 'Update sent for admin approval' };
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
            status: 'active',
        }).lean();
    }

    async reduceStock(productId: string, variantValues: string[], qty: number) {
        const product = await this.productModel.findById(productId);

        if (!product) throw new NotFoundException('Product not found');

        const variant = product.variants.find(v =>
            JSON.stringify(v.values) === JSON.stringify(variantValues)
        );

        if (!variant) throw new BadRequestException('Variant not found');

        if (variant.stock < qty) {
            throw new BadRequestException('Insufficient stock');
        }

        variant.stock -= qty;

        await product.save();

        return product;
    }
    // async reduceStock(productId: string, qty: number) {
    //     const product = await this.productModel.findById(productId);
    //     if (!product) throw new NotFoundException('Product not found');
    //     if (product.stock < qty) throw new BadRequestException('Insufficient stock');

    //     product.stock -= qty;
    //     return product.save();
    // }

    async restoreStock(productId: string, variantValues: string[], qty: number) {
        const product = await this.productModel.findById(productId);

        const variant = product.variants.find(v =>
            JSON.stringify(v.values) === JSON.stringify(variantValues)
        );

        if (!variant) throw new BadRequestException('Variant not found');

        variant.stock += qty;

        await product.save();

        return product;
    }
    // async restoreStock(productId: string, qty: number) {
    //     return this.productModel.findByIdAndUpdate(
    //         productId,
    //         { $inc: { stock: qty } },
    //         { new: true },
    //     );
    // }

    async getSellerProducts(sellerId: string) {
        return this.productModel.find({ sellerId }).populate('categories').populate('giRegions');
    }

    async approveProduct(productId: string) {
        const product = await this.productModel.findById(productId);

        if (!product) throw new NotFoundException();

        product.approveStatus = ProductApproveStatus.APPROVED;
        product.status = 'active';

        await product.save();

        return { message: 'Product approved successfully' };
    }

    async rejectProduct(productId: string) {

        const product = await this.productModel.findById(productId);

        if (!product) throw new NotFoundException();

        product.approveStatus = ProductApproveStatus.REJECTED;
        product.status = 'inactive';

        await product.save();

        return { message: 'Product rejected' };
    }

    async approveProductUpdate(productId: string) {
        const product = await this.productModel.findById(productId);

        if (!product) throw new NotFoundException();

        Object.assign(product, product.pendingUpdates);

        product.pendingUpdates = null;
        product.isUpdatePending = false;
        product.status = 'active';
        product.approveStatus = ProductApproveStatus.APPROVED;
        await product.save();

        return { message: 'Product update approved' };
    }

    async rejectProductUpdate(productId: string) {
        const product = await this.productModel.findById(productId);

        product.pendingUpdates = null;
        product.isUpdatePending = false;

        await product.save();

        return { message: 'Update rejected' };
    }

    async getPendingProducts() {
        return this.productModel.find({
            $or: [
                { approveStatus: 'PENDING' },
                { isUpdatePending: true }
            ]
        })
            .populate('sellerId', 'sellerName email')
            .populate('categories', 'name')
            .lean();
    }

}