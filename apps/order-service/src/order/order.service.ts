import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument } from './schema/order.schema';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class OrderService {
  constructor(
    @InjectModel(Order.name)
    private orderModel: Model<OrderDocument>,
    private httpService: HttpService,
  ) { }

  // async placeOrder(userId: string, token: string) {
  //   const cartRes = await firstValueFrom(
  //     this.httpService.get('http://localhost:3002/cart', {
  //       headers: {
  //         Authorization: token.startsWith('Bearer ')
  //           ? token
  //           : `Bearer ${token}`,
  //       },
  //     }),
  //   );

  //   const cartItems = cartRes.data;

  //   if (!cartItems || cartItems.length === 0) {
  //     throw new UnauthorizedException('Cart is empty');
  //   }

  //   const totalAmount = cartItems.reduce(
  //     (sum, item) => sum + item.price * item.quantity,
  //     0,
  //   );

  //   const order = await this.orderModel.create({
  //     userId,
  //     items: cartItems.map(item => ({
  //       productId: item.productId._id,
  //       quantity: item.quantity,
  //       price: item.price,
  //     })),
  //     totalAmount,
  //     status: 'CREATED',
  //   });

  //   // OPTIONAL: clear cart after order
  //   await firstValueFrom(
  //     this.httpService.delete('http://localhost:3002/cart/clear/all', {
  //       headers: {
  //         Authorization: token.startsWith('Bearer ')
  //           ? token
  //           : `Bearer ${token}`,
  //       },
  //     }),
  //   );

  //   return order;
  // }

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

      const order = await this.orderModel.create({
        userId,
        items: cartItems.map(item => ({
          productId: item.productId._id,
          quantity: item.quantity,
          price: item.price,
        })),
        totalAmount,
        status: 'CREATED',
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
}
