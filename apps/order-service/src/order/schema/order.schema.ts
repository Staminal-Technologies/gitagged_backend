import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, Document } from 'mongoose';
import { OrderStatus } from '../order-status.enum';

export type OrderDocument = Order & Document & {
  createdAt: Date;
  updatedAt: Date;
};

@Schema({ timestamps: true })
export class Order {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop([
    {
      productId: { type: Types.ObjectId, ref: 'Product' },
      sellerId: { type: Types.ObjectId, ref: 'Seller' },
      variant: { type: [String], default: [] },
      title: String,
      quantity: Number,
      price: Number,
      originalPrice: Number,
      discount: Number,
      isReturnAllowed: { type: Boolean, default: false },
      returnValidityDays: { type: Number, default: 0 },
    },
  ])
  items: {
    productId: Types.ObjectId;
    sellerId: Types.ObjectId;
    variant: string[];
    quantity: number;
    price: number;
    originalPrice: number;
    discount: number;
    isReturnAllowed: boolean;
    returnValidityDays: number;
  }[];

  @Prop({ required: true })
  totalAmount: number;

  @Prop({ type: String, enum: OrderStatus, default: OrderStatus.PLACED })
  status: OrderStatus;

  @Prop({ default: false })
  isPaid: boolean;

  @Prop()
  paymentMethod?: 'COD' | 'ONLINE';

  @Prop()
  paidAt?: Date;

  @Prop({ required: true })
  receiverName: string;

  @Prop({ required: true })
  receiverPhone: string;

  @Prop({
    type: {
      addressLine: { type: String, required: true },
      city: { type: String },
      state: { type: String },
      pincode: { type: String },
    },
    required: true,
  })
  receiverAddress: {
    addressLine: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
}

export const OrderSchema = SchemaFactory.createForClass(Order);
