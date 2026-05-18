import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order, OrderDocument } from './schema/order.schema';
import { OrderStatus } from './order-status.enum';
import { HttpService } from '@nestjs/axios';
import { ProductBatch, ProductBatchDocument } from 'apps/product-service/src/products/schema/product-batch.schema';
import { Product, ProductDocument } from 'apps/product-service/src/products/schema/product.schema';

@Injectable()
export class OrderService {

  constructor(
    @InjectModel(Order.name)
    private orderModel: Model<OrderDocument>,
    @InjectModel('User')
    private userModel: Model<any>,
    private httpService: HttpService,
    @InjectModel('Cart')
    private cartModel: Model<any>,
    @InjectModel(ProductBatch.name)
    private productBatchModel: Model<ProductBatchDocument>,
    @InjectModel(Product.name)
    private productModel: Model<ProductDocument>,
  ) { }

  async placeOrder(userId: string, token: string, checkoutData: {
    receiverName: string,
    receiverPhone: string,
    receiverAddress: {
      addressLine: string;
      city?: string;
      state?: string;
      pincode?: string;
      lat?: number;
      lng?: number;
    },
    saveAddress: boolean,
    items: any[]
  }) {
    try {
      const cartItems = checkoutData?.items || [];

      if (!cartItems.length) {
        throw new BadRequestException('No items selected for order');
      }

      const normalize = (arr?: any) => {
        if (!arr || !Array.isArray(arr) || arr.length === 0) return 'default';
        const clean = arr
          .map(v => String(v).trim())
          .filter(v => v !== '' && v.toLowerCase() !== 'default');
        if (clean.length === 0) return 'default';
        return clean.sort().join('-');
      };

      const productIds = cartItems.map(i => new Types.ObjectId(i.productId));
      const bufferDate = new Date();
      bufferDate.setDate(bufferDate.getDate() + 10);

      // Fetch all required batches
      const batches = await this.productBatchModel.find({
        productId: { $in: productIds },
        stock: { $gt: 0 },
        $or: [
          { expiryDate: null },
          { expiryDate: { $exists: false } },
          { expiryDate: { $gte: bufferDate } }
        ]
      }).lean();

      // ✅ Step 1: Validate stock for each item with Fallback Variant Overrides Layer Mappings Rules
      const processedItems = [];
      for (const item of cartItems) {
        const product = await this.productModel.findById(
          item.productId
        );

        if (
          !product ||
          product.status !== 'active' ||
          product.approveStatus !== 'APPROVED'
        ) {
          throw new BadRequestException(
            'Product unavailable'
          );
        }
        const itemVariantKey = normalize(item.variant);

        // Find matching batches for this product
        let matchingBatches = batches.filter(b =>
          b.productId.toString() === item.productId.toString() &&
          normalize(b.variantValues) === itemVariantKey
        );

        // 🔥 FALLBACK LOOKUP RE-ALIGNMENT BUG TRIGGER ENGINE CONTEXT RESOLUTION FIX:
        // Simple integration payload array element 'default' standard parameters mismatch layer entries bypass checks config setup parameters rules data mappings dynamic tracking updates configuration properties overrides status validation metrics updates logic layers check
        if (matchingBatches.length === 0 && itemVariantKey === 'default') {
          matchingBatches = batches.filter(b =>
            b.productId.toString() === item.productId.toString()
          );
        }

        const totalStock = matchingBatches.reduce((sum, b) => sum + b.stock, 0);

        if (item.quantity > totalStock) {
          throw new BadRequestException(`Only ${totalStock} available for product ID: ${item.productId}`);
        }

        processedItems.push({
          productId: new Types.ObjectId(item.productId),
          sellerId: item.sellerId || null,
          variantValues: matchingBatches.length > 0 ? matchingBatches[0].variantValues : (item.variant || ['default']),
          title: item.title || 'Product',
          quantity: item.quantity,
          price: item.price || 0,
          originalPrice: item.originalPrice || 0,
          discount: item.discount || 0,
          status: OrderStatus.PLACED,
        });
      }

      // ✅ Step 2: Deduct Stock from Batches with Fallback Variant Mappings Rules Sync Extractor
      for (const item of cartItems) {
        const itemVariantKey = normalize(item.variant);
        let remainingToDeduct = item.quantity;

        let matchingBatches = batches
          .filter(b =>
            b.productId.toString() === item.productId.toString() &&
            normalize(b.variantValues) === itemVariantKey
          );

        if (matchingBatches.length === 0 && itemVariantKey === 'default') {
          matchingBatches = batches.filter(b =>
            b.productId.toString() === item.productId.toString()
          );
        }

        matchingBatches.sort((a, b) => {
          const aTime = a.expiryDate ? new Date(a.expiryDate).getTime() : Infinity;
          const bTime = b.expiryDate ? new Date(b.expiryDate).getTime() : Infinity;
          return aTime - bTime;
        });

        for (const b of matchingBatches) {
          if (remainingToDeduct <= 0) break;
          const deduct = Math.min(b.stock, remainingToDeduct);

          const updateResult = await this.productBatchModel.findOneAndUpdate(
            { _id: b._id, stock: { $gte: deduct } },
            { $inc: { stock: -deduct } },
            { new: true }
          );

          if (!updateResult) throw new BadRequestException('Stock conflict, please try again');
          remainingToDeduct -= deduct;
        }
      }

      // ✅ Step 3: Create Order Record Document Row
      const order = await this.orderModel.create({
        userId: new Types.ObjectId(userId),
        items: processedItems,
        totalAmount: checkoutData['totalAmount'] || processedItems.reduce((s, i) => s + (i.price * i.quantity), 0),
        status: OrderStatus.PLACED,
        receiverName: checkoutData.receiverName,
        receiverPhone: checkoutData.receiverPhone,
        receiverAddress: checkoutData.receiverAddress,
        isPaid: false
      });

      // ✅ Step 4: Pull ONLY ordered items from User's Cart DB
      for (const item of cartItems) {

        const normalize = (arr: string[]) =>
          arr.slice().sort();

        const finalVariants =
          normalize(
            item.variant?.length
              ? item.variant
              : ['default']
          );

        await this.cartModel.updateOne(
          {
            userId: new Types.ObjectId(userId)
          },
          {
            $pull: {
              items: {
                productId: new Types.ObjectId(
                  item.productId
                ),
                variant: {
                  $all: finalVariants,
                  $size: finalVariants.length
                }
              }
            }
          }
        );
      }
      // await this.cartModel.updateOne(
      //   { userId: new Types.ObjectId(userId) },
      //   {
      //     $pull: {
      //       items: {
      //         productId: { $in: productIds }
      //       }
      //     }
      //   }
      // );

      // ✅ Step 5: Save address if requested profiles entries properties checks logic system maps
      if (checkoutData.saveAddress && checkoutData.receiverAddress) {
        await this.userModel.findByIdAndUpdate(userId, {
          $addToSet: { address: checkoutData.receiverAddress }
        });
      }

      return order;

    } catch (err) {
      console.error("Order Service Error:", err);
      throw err;
    }
  }

  async getMyOrders(userId: string) {

    const orders = await this.orderModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .lean();

    return orders;
  }

  async getAllOrders(user: any) {
    if (user.role === 'ADMIN') {
      return this.orderModel
        .find()
        .populate('userId', 'name email phone address')
        .populate('items.productId', 'title variants')
        .sort({ createdAt: -1 })
        .lean();
    }

    if (user.role === 'SELLER') {
      const orders = await this.orderModel
        .find({ 'items.sellerId': user.sub })
        .populate('userId', 'name email phone address')
        .populate('items.productId', 'title variants')
        .sort({ createdAt: -1 });

      return orders.map(order => ({
        ...order.toObject(),
        items: order.items.filter(
          i => i.sellerId.toString() === user.sub.toString()
        ),
      }));
    }

    return [];
  }

  async getOrderById(id: string, user: any) {

    const order = await this.orderModel
      .findById(id)
      .populate('userId', 'name email phone address')
      .populate('items.productId', 'title variants')
      .lean();

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (
      user.role !== 'ADMIN' &&
      (order.userId as any)._id.toString() !== user.sub
    ) {
      throw new BadRequestException(
        'Unauthorized'
      );
    }

    return order;
  }

  async updateItemStatus(itemId: string, status: OrderStatus, sellerId: string) {
    const order = await this.orderModel.findOne({
      'items._id': itemId
    });

    if (!order) throw new BadRequestException('Order not found');
    const item = order.items.find(i => i._id.toString() === itemId);
    if (!item) throw new BadRequestException('Item not found');

    if (item.sellerId.toString() !== sellerId.toString()) {
      throw new BadRequestException('Unauthorized');
    }

    item.status = status;
    order.status = this.calculateOrderStatus(order.items);
    await order.save();

    return { message: 'Item status updated' };
  }

  private calculateOrderStatus(items: any[]): OrderStatus {
    const statuses = items.map(i => i.status);
    if (statuses.every(s => s === OrderStatus.DELIVERED)) return OrderStatus.DELIVERED;
    if (statuses.every(s => s === OrderStatus.CANCELLED)) return OrderStatus.CANCELLED;
    if (statuses.some(s => s === OrderStatus.SHIPPED)) return OrderStatus.SHIPPED;
    return OrderStatus.PLACED;
  }

  async returnOrder(orderId: string, userId: string, token: String) {
    const order = await this.orderModel.findById(orderId);
    if (!order) throw new BadRequestException('Order not found');

    if (order.userId.toString() !== userId) throw new BadRequestException('Not your order');
    if (order.status !== OrderStatus.DELIVERED) throw new BadRequestException('Return allowed only after delivery');

    for (const item of order.items) {
      if (!item.isReturnAllowed) throw new BadRequestException('Return not allowed');
      if ([OrderStatus.RETURNED, OrderStatus.REPLACED].includes(order.status)) throw new BadRequestException('Already processed');

      const orderDate = new Date(order.createdAt);
      const today = new Date();
      const diffDays = Math.floor((today.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays > item.returnValidityDays) throw new BadRequestException('Return window expired');
    }

    for (const item of order.items) {
      await this.productBatchModel.updateMany(
        { productId: item.productId, variantValues: item.variantValues },
        { $inc: { stock: item.quantity } },
      );
    }

    order.status = OrderStatus.RETURNED;
    await order.save();
    return { message: 'Order returned successfully' };
  }

  async replaceOrder(orderId: string, userId: string, token: String) {
    const order = await this.orderModel.findById(orderId);
    if (!order) throw new BadRequestException('Order not found');

    if ([OrderStatus.RETURNED, OrderStatus.REPLACED].includes(order.status)) throw new BadRequestException('Already processed');
    if (order.userId.toString() !== userId) throw new BadRequestException('Not your order');
    if (order.status !== OrderStatus.DELIVERED) throw new BadRequestException('Replacement allowed only after delivery');

    for (const item of order.items) {
      if (!item.isReturnAllowed) throw new BadRequestException('Replacement not allowed');
      const orderDate = new Date(order.createdAt);
      const today = new Date();
      const diffDays = Math.floor((today.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays > item.returnValidityDays) throw new BadRequestException('Replacement window expired');
    }

    for (const item of order.items) {
      await this.productBatchModel.updateMany(
        { productId: item.productId, variantValues: item.variantValues },
        { $inc: { stock: item.quantity } }
      );
    }

    for (const item of order.items) {
      let remaining = item.quantity;
      const batches = await this.productBatchModel.find({
        productId: item.productId,
        variantValues: item.variantValues,
        stock: { $gt: 0 }
      }).sort({ expiryDate: 1 });

      for (const b of batches) {
        if (remaining <= 0) break;
        const deduct = Math.min(b.stock, remaining);

        const updated = await this.productBatchModel.findOneAndUpdate(
          { _id: b._id, stock: { $gte: deduct } },
          { $inc: { stock: -deduct } },
          { new: true }
        );

        if (!updated) throw new BadRequestException('Replacement stock not available');
        remaining -= deduct;
      }

      if (remaining > 0) throw new BadRequestException('Replacement stock not available');
    }

    order.status = OrderStatus.REPLACED;
    await order.save();
    return { message: 'Replacement processed' };
  }
}