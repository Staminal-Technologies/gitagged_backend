import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order, OrderDocument } from './schema/order.schema';
import { OrderStatus } from './order-status.enum';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ProductBatch, ProductBatchDocument } from 'apps/product-service/src/products/schema/product-batch.schema';

@Injectable()
export class OrderService {

  constructor(
    @InjectModel(Order.name)
    private orderModel: Model<OrderDocument>,
    @InjectModel('User')
    private userModel: Model<any>,
    private httpService: HttpService,
    @InjectModel(ProductBatch.name)
    private productBatchModel: Model<ProductBatchDocument>,
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
    saveAddress: boolean
  }) {
    try {
      const cartRes = await firstValueFrom(
        this.httpService.get('http://localhost:3002/cart', {
          headers: {
            Authorization: token.startsWith('Bearer ')
              ? token
              : `Bearer ${token}`,
          },
        }),
      );
      const cart = cartRes.data;

      const cartItems = cart?.items || [];

      if (!cartItems.length) {
        throw new BadRequestException('Cart is empty');
      }

      // const normalize = (arr: string[]) => arr.slice().sort().join('-');
      const normalize = (arr?: any) => {
        if (!arr || !Array.isArray(arr) || arr.length === 0) return 'default';

        const clean = arr
          .map(v => String(v).trim())
          .filter(v => v !== '' && v.toLowerCase() !== 'default');

        if (clean.length === 0) return 'default';

        return clean.sort().join('-');
      };

      const productIds = cartItems.map(i => {
        const id = typeof i.productId === 'object' ? i.productId._id : i.productId;
        return new Types.ObjectId(id.toString());
      });
      const bufferDate = new Date();
      bufferDate.setDate(bufferDate.getDate() + 10);

      // 🔥 FETCH ALL BATCHES ONCE
      const batches = await this.productBatchModel.find({
        productId: { $in: productIds },
        stock: { $gt: 0 },
        $or: [
          { expiryDate: { $exists: false } },
          { expiryDate: null },
          { expiryDate: "" as any },
          { expiryDate: { $gte: bufferDate } }
        ]
      }).lean();

      const batchMap = new Map();

      for (const b of batches) {
        const bId = b.productId.toString();
        const key = `${bId}-${normalize(b.variantValues)}`;
        if (!batchMap.has(key)) batchMap.set(key, []);
        batchMap.get(key).push(b);
      }

      // ✅ Step 1: Validate stock
      for (const item of cartItems) {
        const product = item.productId;

        const variantArr = item.variant || item.variants || [];
        const variantKey = normalize(variantArr);

        const key = `${product._id}-${variantKey}`;

        const batchList = batchMap.get(key) || [];

        const totalStock = batchList.reduce((sum, b) => sum + b.stock, 0);

        if (item.quantity > totalStock) {
          throw new BadRequestException(`Only ${totalStock} available for ${product.title}`);
        }
      }

      // ✅ Step 2: Reduce stock
      for (const item of cartItems) {
        const product = item.productId;

        const key = `${product._id}-${normalize(item.variant)}`;

        const batchList = (batchMap.get(key) || [])
          .sort((a, b) => {
            const aTime = a.expiryDate ? new Date(a.expiryDate).getTime() : Infinity;
            const bTime = b.expiryDate ? new Date(b.expiryDate).getTime() : Infinity;
            return aTime - bTime;
          });

        let remaining = item.quantity;

        for (const b of batchList) {
          if (remaining <= 0) break;

          const deduct = Math.min(b.stock, remaining);

          const updated = await this.productBatchModel.findOneAndUpdate(
            {
              _id: b._id,
              stock: { $gte: deduct } // 🔥 IMPORTANT CONDITION
            },
            {
              $inc: { stock: -deduct }
            },
            { new: true }
          );

          if (!updated) {
            throw new BadRequestException('Stock changed, please try again');
          }

          remaining -= deduct;
        }
        if (remaining > 0) {
          throw new BadRequestException('Stock mismatch');
        }
      }

      // order creation..
      const items = cartItems.map(item => {
        const product = item.productId;

        const variantArr = item.variant || item.variants || [];

        const key = `${product._id}-${normalize(item.variant)}`;
        const batchList = batchMap.get(key) || [];

        const firstBatch = batchList.sort((a, b) => {
          const aTime = a.expiryDate ? new Date(a.expiryDate).getTime() : Infinity;
          const bTime = b.expiryDate ? new Date(b.expiryDate).getTime() : Infinity;
          return aTime - bTime;
        })[0];

        const variant = product.variants.find(v =>
          normalize(v.values) === normalize(item.variant)
        );

        const originalPrice =
          firstBatch?.priceOverride ??
          variant?.price ??
          product.price ??
          0;

        const discount =
          firstBatch?.discountPercentageOverride ??
          variant?.discountPercentage ??
          product.discountPercentage ??
          0;

        const finalPrice = originalPrice - (originalPrice * discount) / 100;

        return {
          productId: product._id,
          sellerId: item.sellerId,
          variantValues: variantArr.length ? variantArr : ['default'],
          title: product?.title || 'Unknown Product',
          quantity: item.quantity,
          price: finalPrice,
          originalPrice,
          discount,
          isReturnAllowed: product.isReturnAllowed || false,
          returnValidityDays: product.returnValidityDays || 0,
          status: OrderStatus.PLACED,
        };
      });

      const totalAmount = items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
      const order = await this.orderModel.create({
        userId,
        items: items,
        totalAmount: totalAmount,
        status: OrderStatus.PLACED,
        receiverName: checkoutData.receiverName,
        receiverPhone: checkoutData.receiverPhone,
        receiverAddress: checkoutData.receiverAddress,
      });

      // save address to the user data..
      if (checkoutData.saveAddress) {
        await this.userModel.findByIdAndUpdate(
          userId,
          {
            $addToSet: {
              address: {
                addressLine: checkoutData.receiverAddress.addressLine,
                city: checkoutData.receiverAddress.city,
                state: checkoutData.receiverAddress.state,
                pincode: checkoutData.receiverAddress.pincode,
                lat: checkoutData.receiverAddress.lat,
                lng: checkoutData.receiverAddress.lng,
              },
            },
          },
        );
      }

      await firstValueFrom(
        this.httpService.delete('http://localhost:3002/cart/clear/all', {
          headers: {
            Authorization: token.startsWith('Bearer ')
              ? token
              : `Bearer ${token}`,
          },
        }),
      );

      return order;

    } catch (err) {
      throw err;
    }
  }

  async getMyOrders(userId: string) {
    return this.orderModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .lean();
  }

  async getAllOrders(user: any) {

    // 🟢 ADMIN
    if (user.role === 'ADMIN') {
      return this.orderModel
        .find()
        .populate('userId', 'name email phone address')
        .populate('items.productId', 'title variants')
        .sort({ createdAt: -1 })
        .lean();
    }

    // 🟠 SELLER
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

  async getOrderById(id: string) {
    return this.orderModel
      .findById(id)
      .populate('userId', 'name email phone address')
      .populate('items.productId', 'title variants')
      .lean();
  }

  async updateItemStatus(itemId: string, status: OrderStatus, sellerId: string) {

    const order = await this.orderModel.findOne({
      'items._id': itemId
    });

    if (!order) throw new BadRequestException('Order not found');

    const item = order.items.find(i => i._id.toString() === itemId);

    if (!item) throw new BadRequestException('Item not found');

    // 🔥 SECURITY CHECK
    if (item.sellerId.toString() !== sellerId.toString()) {
      throw new BadRequestException('Unauthorized');
    }

    item.status = status;

    // 🔥 IMPORTANT → UPDATE ORDER STATUS ALSO
    order.status = this.calculateOrderStatus(order.items);

    await order.save();

    return { message: 'Item status updated' };
  }

  private calculateOrderStatus(items: any[]): OrderStatus {
    const statuses = items.map(i => i.status);

    if (statuses.every(s => s === OrderStatus.DELIVERED)) {
      return OrderStatus.DELIVERED;
    }

    if (statuses.every(s => s === OrderStatus.CANCELLED)) {
      return OrderStatus.CANCELLED;
    }

    if (statuses.some(s => s === OrderStatus.SHIPPED)) {
      return OrderStatus.SHIPPED; // or PARTIAL (better later)
    }

    return OrderStatus.PLACED;
  }

  //return service
  async returnOrder(orderId: string, userId: string, token: String) {
    const order = await this.orderModel.findById(orderId);

    if (!order) throw new BadRequestException('Order not found');

    if (order.userId.toString() !== userId) {
      throw new BadRequestException('Not your order');
    }
    if (order.status !== OrderStatus.DELIVERED) {
      throw new BadRequestException('Return allowed only after delivery');
    }

    for (const item of order.items) {

      if (!item.isReturnAllowed) {
        throw new BadRequestException('Return not allowed');
      }

      if ([OrderStatus.RETURNED, OrderStatus.REPLACED].includes(order.status)) {
        throw new BadRequestException('Already processed');
      }

      const orderDate = new Date(order.createdAt);
      const today = new Date();

      const diffDays = Math.floor(
        (today.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays > item.returnValidityDays) {
        throw new BadRequestException('Return window expired');
      }
    }

    // 🔥 RESTORE STOCK (+1)
    for (const item of order.items) {
      await this.productBatchModel.updateMany(
        {
          productId: item.productId,
          variantValues: item.variantValues
        },
        {
          $inc: { stock: item.quantity }
        },
      );

    }

    order.status = OrderStatus.RETURNED;
    await order.save();

    return { message: 'Order returned successfully' };
  }

  async replaceOrder(orderId: string, userId: string, token: String) {
    const order = await this.orderModel.findById(orderId);

    if (!order) throw new BadRequestException('Order not found');

    if ([OrderStatus.RETURNED, OrderStatus.REPLACED].includes(order.status)) {
      throw new BadRequestException('Already processed');
    }

    if (order.userId.toString() !== userId) {
      throw new BadRequestException('Not your order');
    }

    if (order.status !== OrderStatus.DELIVERED) {
      throw new BadRequestException('Replacement allowed only after delivery');
    }

    // 🔥 VALIDITY CHECK (same as return)
    for (const item of order.items) {

      if (!item.isReturnAllowed) {
        throw new BadRequestException('Replacement not allowed');
      }

      const orderDate = new Date(order.createdAt);
      const today = new Date();

      const diffDays = Math.floor(
        (today.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays > item.returnValidityDays) {
        throw new BadRequestException('Replacement window expired');
      }
    }

    // 🔥 STEP 1: RESTORE OLD PRODUCT (+1)
    for (const item of order.items) {
      await this.productBatchModel.updateMany(
        {
          productId: item.productId,
          variantValues: item.variantValues
        },
        {
          $inc: { stock: item.quantity }
        }
      );
    }

    // 🔥 STEP 2: REDUCE NEW PRODUCT (-1)
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
          {
            _id: b._id,
            stock: { $gte: deduct }
          },
          {
            $inc: { stock: -deduct }
          },
          { new: true }
        );

        if (!updated) {
          throw new BadRequestException('Replacement stock not available');
        }

        remaining -= deduct;
      }

      if (remaining > 0) {
        throw new BadRequestException('Replacement stock not available');
      }
    }

    order.status = OrderStatus.REPLACED;
    await order.save();

    return { message: 'Replacement processed' };
  }

}