import { Injectable, BadRequestException, NotFoundException, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model, Types } from 'mongoose';
import { Product, ProductDocument } from './schema/product.schema';
import slugify from 'slugify';
import { Category, CategoryDocument } from '../categories/schema/category.schema';
import cloudinary from '../common/cloudinary/cloudinary.config';
import { MailService } from '../common/mail/mail.service';
import { ProductApproveStatus } from '../enum/product-approve-status.enum';
import { ProductBatch, ProductBatchDocument } from './schema/product-batch.schema';
import { Seller, SellerDocument } from '../schema/seller.schema';

@Injectable()
export class ProductsService {
    constructor(
        @InjectModel(Product.name) private productModel: Model<ProductDocument>,
        @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
        private mailService: MailService,
        @InjectModel(ProductBatch.name)
        private productBatchModel: Model<ProductBatchDocument>,
        @InjectModel(Seller.name)
        private sellerModel: Model<SellerDocument>,
    ) { }

    async findAll(user: any) {
        const now = new Date();
        const futureDate = new Date();
        futureDate.setDate(now.getDate() + 10);

        if (!user || user.role === 'USER') {
            const validProductIds = await this.productBatchModel.aggregate([
                {
                    $match: {
                        $or: [
                            { expiryDate: null },
                            { expiryDate: { $gte: futureDate } }
                        ],
                        stock: { $gt: 0 }
                    }
                },
                {
                    $group: {
                        _id: "$productId"
                    }
                }
            ]);

            const ids = validProductIds.map(p => p._id);

            const products = await this.productModel.find({
                _id: { $in: ids },
                status: 'active',
                approveStatus: ProductApproveStatus.APPROVED
            })
                .populate('categories', 'name')
                .populate('giRegions', 'name')
                .lean();

            const result = await Promise.all(
                products.map(async (p) => {

                    const batches = await this.productBatchModel.find({
                        productId: p._id,
                        stock: { $gt: 0 },
                        $or: [
                            { expiryDate: null },
                            { expiryDate: { $gte: futureDate } }
                        ]
                    }).sort({ stock: -1 });

                    const firstAvailableBatch = batches[0] || null;

                    const totalStock = batches.reduce(
                        (sum, b) => sum + b.stock,
                        0
                    );

                    return {
                        ...p,

                        totalStock,

                        firstAvailableVariant:
                            firstAvailableBatch?.variantValues || null,

                        isOutOfStock:
                            totalStock <= 0,
                    };
                })
            );

            return result;
        }

        if (user.role === 'ADMIN') {
            const products = await this.productModel.find()
                .populate('categories', 'name')
                .populate('giRegions', 'name')
                .lean();

            const result = await Promise.all(
                products.map(async (p) => {
                    const batches = await this.productBatchModel.find({
                        productId: p._id,
                        stock: { $gt: 0 }
                    });

                    const totalStock = batches.reduce((sum, b) => sum + b.stock, 0);

                    return {
                        ...p,
                        totalStock
                    };
                })
            );

            return result;
        }

        const products = await this.productModel.find({ sellerId: user.sub })
            .populate('categories', 'name')
            .populate('giRegions', 'name')
            .lean();

        const result = await Promise.all(
            products.map(async (p) => {
                const batches = await this.productBatchModel.find({
                    productId: p._id,
                    stock: { $gt: 0 }
                });

                const totalStock = batches.reduce((sum, b) => sum + b.stock, 0);

                return {
                    ...p,
                    totalStock
                };
            })
        );

        return result;
    }

    async findById(id: string) {
        const product = await this.productModel.findById(id).lean();

        if (!product || product.status !== 'active' || product.approveStatus !== 'APPROVED') {
            throw new NotFoundException('Product not available');
        }
        return product;
    }

    async findByCategory(categoryId: string) {

        const now = new Date();

        const validProductIds =
            await this.productBatchModel.aggregate([
                {
                    $match: {
                        stock: { $gt: 0 },
                        $or: [
                            { expiryDate: null },
                            { expiryDate: { $gte: now } }
                        ]
                    }
                },
                {
                    $group: {
                        _id: "$productId"
                    }
                }
            ]);

        const ids = validProductIds.map(p => p._id);

        return this.productModel.find({
            _id: { $in: ids },
            categories: categoryId,
            status: 'active',
            approveStatus: ProductApproveStatus.APPROVED
        })
            .populate('categories', 'name')
            .populate('giRegions', 'name')
            .lean();
    }

    async findByGIRegion(regionId: string) {

        const now = new Date();

        const validProductIds =
            await this.productBatchModel.aggregate([
                {
                    $match: {
                        stock: { $gt: 0 },
                        $or: [
                            { expiryDate: null },
                            { expiryDate: { $gte: now } }
                        ]
                    }
                },
                {
                    $group: {
                        _id: "$productId"
                    }
                }
            ]);

        const ids = validProductIds.map(p => p._id);

        return this.productModel.find({
            _id: { $in: ids },
            giRegions: regionId,
            status: 'active',
            approveStatus: ProductApproveStatus.APPROVED
        })
            .populate('categories', 'name')
            .populate('giRegions', 'name')
            .lean();
    }

    async create(data: any, user: any) {

        if (user.role !== 'SELLER') {
            throw new UnauthorizedException();
        }

        const categories = await this.categoryModel.find({
            _id: { $in: data.categories }
        });
        const requiresExpiry = categories.some(c => c.requiresExpiry);
        const requiresReturn = categories.some(c => c.requiresReturnPolicy);

        // 🔥 CASE 1: NO VARIANTS (simple product)
        if (!data.variants || data.variants.length === 0) {
            data.variantOptions = [];

            data.variants = [
                {
                    values: ['default'],
                    price: data.price || 0,
                    discountPercentage: data.discountPercentage || 0,
                    sku: 'DEFAULT',
                    images: data.images || [],
                }
            ];
        }

        // 🔥 CASE 2: HAS VARIANTS
        else {
            data.variants = data.variants.map((v, index) => ({
                ...v,
                values: v.values.sort(),
                discountPercentage: v.discountPercentage || 0,
                sku: v.sku || `${data.title.substring(0, 3).toUpperCase()}-${index + 1}`,
                images: v.images || [],
            }));
        }

        // 🔥 EXPIRY VALIDATION
        if (requiresExpiry) {
            if (!data.initialBatches || data.initialBatches.length === 0) {
                throw new BadRequestException('Expiry batches required');
            }
            const hasExpiry = data.initialBatches?.every(b => b.expiryDate);

            if (!hasExpiry) {
                throw new BadRequestException('Expiry date is required for selected category');
            }
        }

        // 🔥 RETURN VALIDATION
        if (requiresReturn) {
            if (data.isReturnAllowed !== true) {
                throw new BadRequestException('Return must be allowed for this category');
            }

            if (!data.returnValidityDays || data.returnValidityDays <= 0) {
                throw new BadRequestException('Return validity is required');
            }
        }

        if (!data.initialBatches || data.initialBatches.length === 0) {
            throw new BadRequestException('Initial stock is required');
        }

        const validVariants = data.variants.map(v => v.values.sort().join('-'));

        for (const batch of data.initialBatches) {
            const key = batch.variantValues.sort().join('-');

            if (!validVariants.includes(key)) {
                throw new BadRequestException('Invalid variant in batch');
            }
        }

        const product = await this.productModel.create({
            ...data,
            sellerId: user.sub,
            approveStatus: ProductApproveStatus.PENDING,
        });

        if (data.initialBatches && data.initialBatches.length > 0) {
            await this.productBatchModel.insertMany(
                data.initialBatches.map(batch => ({
                    productId: product._id,
                    variantValues: batch.variantValues.sort(),
                    stock: batch.stock,
                    expiryDate: batch.expiryDate || null,
                    priceOverride: batch.priceOverride || null,
                    discountPercentageOverride: batch.discountPercentageOverride || null,
                }))
            );
        }

        return product;
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

            if (product.approveStatus === ProductApproveStatus.PENDING) {
                throw new BadRequestException('You cannot change the product while approval is pending');
            }

            if (product.isUpdatePending && product.updateRequestStatus === 'PENDING') {
                throw new BadRequestException('You cannot change the product, update request is already pending');
            }

            product.pendingUpdates = data;
            product.isUpdatePending = true;
            product.updateRequestStatus = 'PENDING';

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

        if (product.approveStatus === 'PENDING') {
            throw new BadRequestException('Cannot delete pending Appoval product');
        }

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
            approveStatus: ProductApproveStatus.APPROVED,
        }).lean();
    }

    async reduceStock(productId: string, variantValues: string[], qty: number) {
        variantValues = variantValues.sort();
        const batch = await this.productBatchModel
            .findOne({
                productId,
                variantValues,
                stock: { $gte: qty },
                $or: [
                    { expiryDate: null },
                    { expiryDate: { $gte: new Date() } }
                ]
            })
            .sort({ expiryDate: 1 });

        if (!batch) {
            throw new BadRequestException('Insufficient stock or variant not found');
        }

        batch.stock -= qty;
        await batch.save();

        return batch;
    }

    async restoreStock(productId: string, variantValues: string[], qty: number) {
        variantValues = variantValues.sort();
        const batch = await this.productBatchModel.findOne({
            productId,
            variantValues: variantValues.sort()
        });

        if (!batch) throw new BadRequestException('Batch not found');

        batch.stock += qty;
        await batch.save();

        return batch;
    }

    async getSellerProducts(sellerId: string) {
        const products = await this.productModel.find({ sellerId })
            .populate('categories', 'name')
            .populate('giRegions', 'name')
            .lean();

        const result = await Promise.all(
            products.map(async (p) => {
                const batches = await this.productBatchModel.find({
                    productId: p._id,
                    stock: { $gt: 0 }
                });

                const totalStock = batches.reduce((sum, b) => sum + b.stock, 0);

                return {
                    ...p,
                    totalStock
                };
            })
        );

        return result;
    }

    async approveProduct(productId: string) {
        const product = await this.productModel.findById(productId);

        if (!product) throw new NotFoundException();

        product.approveStatus = ProductApproveStatus.APPROVED;
        product.status = 'active';
        product.rejectionReason = null;

        await product.save();

        return { message: 'Product approved successfully' };
    }

    async rejectProduct(productId: string, reason: string) {

        if (!reason || reason.trim() === '') {
            throw new BadRequestException('Rejection reason required!!');
        }

        const product = await this.productModel.findById(productId);

        if (!product) throw new NotFoundException();

        product.approveStatus = ProductApproveStatus.REJECTED;
        product.status = 'inactive';
        product.rejectionReason = reason;

        await product.save();

        //  SEND EMAIL
        const seller = await this.sellerModel.findById(product.sellerId);

        await this.mailService.sendEmail(
            seller.email,
            'Product Rejected',
            `
        <h2>Your product was rejected</h2>
        <p><b>Product:</b> ${product.title}</p>
        <p><b>Reason:</b> ${reason}</p>
        <p>Please update and resubmit.</p>
        `
        );

        return { message: 'Product rejected' };
    }

    async approveProductUpdate(productId: string) {
        const product = await this.productModel.findById(productId);

        if (!product) throw new NotFoundException();

        const updates = product.pendingUpdates;

        if (updates.variants) {
            product.variants = updates.variants.map((v: any, i: number) => ({
                ...v,
                discountPercentage: updates.discountPercentage ?? 0,
                images: v.images || [],
            }));
        }

        Object.assign(product, {
            ...updates,
            variants: product.variants
        });
        product.pendingUpdates = null;
        product.isUpdatePending = false;
        product.status = 'active';
        product.rejectionReason = null;
        product.updateRequestStatus = null;
        await product.save();

        return { message: 'Product update approved' };
    }

    async rejectProductUpdate(productId: string, reason: string) {
        const product = await this.productModel.findById(productId);

        if (!reason || reason.trim() === '') {
            throw new BadRequestException(
                'Rejection reason required'
            );
        }

        // product.pendingUpdates = null;
        product.isUpdatePending = true;
        product.rejectionReason = reason;
        product.updateRequestStatus = 'REJECTED';

        await product.save();

        return { message: 'Update rejected' };
    }

    async getPendingProducts() {
        const products = await this.productModel.find({
            $or: [
                { approveStatus: 'PENDING' },
                { isUpdatePending: true }
            ]
        })
            .populate('sellerId', 'sellerName email')
            .populate('categories', 'name')
            .populate('giRegions', 'name')
            .lean();

        const result = await Promise.all(
            products.map(async (p) => {

                const batches = await this.productBatchModel.find({
                    productId: p._id
                }).lean();
                const totalStock = batches.reduce((sum, b) => sum + b.stock, 0);

                return {
                    ...p,
                    batches,
                    totalStock,
                };
            })
        );

        return result;
    }

    async getBatchesByProductId(productId: string) {
        const objId = new Types.ObjectId(productId);
        return this.productBatchModel.find({
            productId: objId,
            stock: { $gt: 0 },
            $or: [
                { expiryDate: null },
                { expiryDate: { $gte: new Date() } }
            ]
        }).lean();
    }

}