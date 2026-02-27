import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument } from './schema/order.schema';
import { OrderStatus } from './order-status.enum';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class OrderService {
  constructor(
    @InjectModel(Order.name)
    private orderModel: Model<OrderDocument>,
    @InjectModel('User')
    private userModel: Model<any>,
    private httpService: HttpService,
  ) { }

  async placeOrder(userId: string, token: string, checkoutData: { receiverName: string, receiverPhone: string, receiverAddress: string, saveAddress: boolean }) {
    try {
      const cartRes = await firstValueFrom(
        this.httpService.get('http://localhost:3002/cart', {
          headers: { Authorization: token },
        }),
      );

      const cartItems = cartRes.data;

      if (!cartItems || cartItems.length === 0) {
        throw new UnauthorizedException('Cart is empty');
      }

      const totalAmount = cartItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      );

      // product stock check and update..
      for (const item of cartItems) {
        await firstValueFrom(
          this.httpService.patch(
            `http://localhost:3002/products/${item.productId._id}/reduce-stock`,
            { quantity: item.quantity },
          ),
        );
      }

      // order creation..
      const order = await this.orderModel.create({
        userId,
        items: cartItems.map(item => ({
          productId: item.productId._id,
          sellerId: item.productId.sellerId,
          quantity: item.quantity,
          price: item.price,
        })),
        totalAmount,
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
              address: checkoutData.receiverAddress,
            },
          },
        );
      }

      // OPTIONAL: clear cart after order
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
      console.error('Order-service cart call failed:', err.response?.data || err.message);
      throw err;
    }
  }

  async getMyOrders(userId: string) {
    return this.orderModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .lean();
  }

  // async getAllOrders() {
  //   return this.orderModel
  //     .find()
  //     .populate('userId', 'name email phone address')
  //     .populate('items.productId', 'title price stock')
  //     .sort({ createdAt: -1 })
  //     .lean();
  // }
  async getAllOrders(user: any) {

    // 🟢 ADMIN
    if (user.role === 'ADMIN') {
      return this.orderModel
        .find()
        .populate('userId', 'name email phone address')
        .populate('items.productId', 'title price stock')
        .sort({ createdAt: -1 })
        .lean();
    }

    // 🟠 SELLER
    if (user.role === 'seller') {

      return this.orderModel
        .find({ 'items.sellerId': user.sub })   // ✅ filter by sellerId
        .populate('userId', 'name email phone address')
        .populate('items.productId', 'title price stock')
        .sort({ createdAt: -1 })
        .lean();
    }

    return [];
  }

  async getOrderById(id: string) {
    return this.orderModel
      .findById(id)
      .populate('userId', 'name email phone address')
      .populate('items.productId', 'title price stock')
      .lean();
  }

  async updateOrderStatus(id: string, status: OrderStatus) {
    const order = await this.orderModel.findById(id);

    if (!order) {
      throw new UnauthorizedException('Order not found');
    }

    if (order.status === status) {
      return order;
    }

    if (
      order.status !== OrderStatus.CANCELLED &&
      status === OrderStatus.CANCELLED
    ) {
      for (const item of order.items) {

        const productId =
          typeof item.productId === 'object'
            ? item.productId.toString()
            : item.productId;

        await firstValueFrom(
          this.httpService.patch(
            `http://localhost:3002/products/${productId}/restore-stock`,
            { quantity: item.quantity },
          ),
        );
      }
    }

    order.status = status;
    await order.save();

    return order;
  }
//   async updateOrderStatus(id: string, status: OrderStatus, user: any) {

//   const order = await this.orderModel.findById(id);

//   if (!order) {
//     throw new UnauthorizedException('Order not found');
//   }

//   // 🟢 ADMIN
//   if (user.role === 'ADMIN') {
//     order.status = status;
//     await order.save();
//     return order;
//   }

//   // 🟠 SELLER
//   if (user.role === 'seller') {

//     const sellerOwnsOrder = order.items.some(
//       item => item.sellerId.toString() === user.sub
//     );

//     if (!sellerOwnsOrder) {
//       throw new UnauthorizedException('Not your order');
//     }

//     order.status = status;
//     await order.save();
//     return order;
//   }
// }

}
