import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, Document } from 'mongoose';
import { OrderStatus } from '../order-status.enum';

export type OrderDocument = Order & Document;

@Schema({ timestamps: true })
export class Order {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop([
    {
      productId: { type: Types.ObjectId, ref: 'Product' },
      title: String,
      quantity: Number,
      price: Number,
    },
  ])
  items: {
    productId: Types.ObjectId;
    sellerId: Types.ObjectId;
    quantity: number;
    price: number;
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

  @Prop({ required: true })
  receiverAddress: string;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
