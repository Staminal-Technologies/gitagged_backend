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
    private httpService: HttpService,
  ) { }

  async placeOrder(userId: string, token: string) {
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

      //order creation..
      const order = await this.orderModel.create({
        userId,
        items: cartItems.map(item => ({
          productId: item.productId._id,
          quantity: item.quantity,
          price: item.price,
        })),
        totalAmount,
        status: OrderStatus.PLACED,
      });

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

  async getAllOrdersForAdmin() {
    return this.orderModel
      .find()
      .populate('userId', 'name email phone address')
      .populate('items.productId', 'title price stock')
      .sort({ createdAt: -1 })
      .lean();
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

    // 🔺 Restore stock ONLY when cancelling
    if (
      order.status !== OrderStatus.CANCELLED &&
      status === OrderStatus.CANCELLED
    ) {
      for (const item of order.items) {
        await firstValueFrom(
          this.httpService.patch(
            `http://localhost:3002/products/${item.productId}/restore-stock`,
            { quantity: item.quantity },
          ),
        );
      }
    }

    // 🔻 If reactivating cancelled order → reduce stock again
    if (
      order.status === OrderStatus.CANCELLED &&
      status === OrderStatus.PLACED
    ) {
      for (const item of order.items) {
        await firstValueFrom(
          this.httpService.patch(
            `http://localhost:3002/products/${item.productId}/reduce-stock`,
            { quantity: item.quantity },
          ),
        );
      }
    }

    order.status = status;
    await order.save();

    return order;
  }

}
