import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument } from './schema/order.schema';
import { OrderStatus } from './order-status.enum';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class OrderService {
  private normalize(arr: string[]) {
    return arr.slice().sort().join('-');
  }

  constructor(
    @InjectModel(Order.name)
    private orderModel: Model<OrderDocument>,
    @InjectModel('User')
    private userModel: Model<any>,
    private httpService: HttpService,
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

      // const cart = Array.isArray(cartList) ? cartList[0] : cartList;

      const cartItems = cart?.items || [];

      if (!cartItems || cartItems.length === 0) {
        throw new BadRequestException('Cart is empty');
      }

      const totalAmount = cartItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      );

      const updatedProducts: { id: string; qty: number; variant: string[] }[] = [];

      try {
        // ✅ Step 1: Validate stock

        for (const item of cartItems) {
          if (!item.productId || !item.productId.variants) {
            throw new BadRequestException('Invalid product data');
          }
          const product = item.productId;

          const selectedVariant = product.variants.find(v =>
            this.normalize(v.values) === this.normalize(item.variant || [])
          );

          if (!selectedVariant) {
            throw new BadRequestException('Variant not found');
          }

          const now = new Date();
          const bufferDate = new Date();
          bufferDate.setDate(now.getDate() + 10);

          if (selectedVariant.expiryDate && new Date(selectedVariant.expiryDate) < bufferDate) {
            throw new BadRequestException(`Product ${product.title} is near expiry`);
          }

          if (!selectedVariant || selectedVariant.stock < item.quantity) {
            throw new BadRequestException(
              `Only ${selectedVariant.stock} items available!!`
            );
          }
        }

        // ✅ Step 2: Reduce stock
        for (const item of cartItems) {
          const productId =
            typeof item.productId === 'object'
              ? item.productId._id
              : item.productId;

          await firstValueFrom(
            this.httpService.patch(
              `http://localhost:3002/products/${productId}/reduce-stock`,
              {
                quantity: item.quantity,
                variant: item.variant
              },
              {
                headers: {
                  Authorization: token.startsWith('Bearer ')
                    ? token
                    : `Bearer ${token}`,
                },
              },
            ),
          );

          updatedProducts.push({
            id: productId,
            qty: item.quantity,
            variant: item.variant,
          });
        }

      } catch (err) {
        // 🔥 ROLLBACK
        for (const p of updatedProducts) {
          await firstValueFrom(
            this.httpService.patch(
              `http://localhost:3002/products/${p.id}/restore-stock`,
              {
                quantity: p.qty,
                variant: p.variant
              },
              {
                headers: {
                  Authorization: token.startsWith('Bearer ')
                    ? token
                    : `Bearer ${token}`,
                },
              },
            ),
          );
        }

        throw err;
      }

      // order creation..
      const order = await this.orderModel.create({
        userId,
        items: cartItems.map(item => {
          const product = item.productId;

          return {
            productId: product._id,
            sellerId: item.sellerId,
            variant: item.variant || [],
            title: product?.title || 'Unknown Product',
            quantity: item.quantity,
            price: item.price,
            originalPrice: item.originalPrice || item.price,
            discount: item.discount || 0,

            // 🔥 ADD THIS
            isReturnAllowed: product.isReturnAllowed || false,
            returnValidityDays: product.returnValidityDays || 0,
          }
          // productId:
          //   typeof item.productId === 'object'
          //     ? item.productId._id
          //     : item.productId,
          // sellerId: item.sellerId,
          // variant: item.variant || [],
          // title: item.productId?.title || 'Unknown Product',
          // quantity: item.quantity,
          // price: item.price,
          // originalPrice: item.originalPrice || item.price,
          // discount: item.discount || 0,
        }),
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
      const error = err as any;

      console.error(
        'Order-service cart call failed:',
        error?.response?.data || error?.message || error
      );

      throw error;
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

      return this.orderModel
        .find({ 'items.sellerId': user.sub })   // ✅ filter by sellerId
        .populate('userId', 'name email phone address')
        .populate('items.productId', 'title variants')
        .sort({ createdAt: -1 })
        .lean();
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

  async updateOrderStatus(id: string, status: OrderStatus, token: String) {
    const order = await this.orderModel.findById(id);

    if (!order) {
      throw new BadRequestException('Order not found');
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
            {
              quantity: item.quantity,
              variant: item.variant
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          ),
        );
      }
    }

    order.status = status;
    await order.save();

    return order;
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
      await firstValueFrom(
        this.httpService.patch(
          `http://localhost:3002/products/${item.productId}/restore-stock`,
          {
            quantity: item.quantity,
            variant: item.variant
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            }
          }
        )
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
      throw new BadRequestException('Return allowed only after delivery');
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
      await firstValueFrom(
        this.httpService.patch(
          `http://localhost:3002/products/${item.productId}/restore-stock`,
          {
            quantity: item.quantity,
            variant: item.variant
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            }
          }
        )
      );
    }

    // 🔥 CHECK STOCK BEFORE REDUCE
    for (const item of order.items) {
      const productRes = await firstValueFrom(
        this.httpService.get(`http://localhost:3002/products/${item.productId}`)
      );

      const product = productRes.data;

      const variant = product.variants.find(v =>
        this.normalize(v.values) === this.normalize(item.variant)
      );

      if (!variant || variant.stock < item.quantity) {
        throw new BadRequestException('Replacement product out of stock');
      }
    }

    // 🔥 STEP 2: REDUCE NEW PRODUCT (-1)
    for (const item of order.items) {
      await firstValueFrom(
        this.httpService.patch(
          `http://localhost:3002/products/${item.productId}/reduce-stock`,
          {
            quantity: item.quantity,
            variant: item.variant
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            }
          }
        )
      );
    }

    order.status = OrderStatus.REPLACED;
    await order.save();

    return { message: 'Replacement processed' };
  }

}