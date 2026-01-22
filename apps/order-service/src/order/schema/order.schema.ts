import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, Document } from 'mongoose';

export type OrderDocument = Order & Document;

@Schema({ timestamps: true })
export class Order {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop([
    {
      productId: { type: Types.ObjectId, ref: 'Product' },
      quantity: Number,
      price: Number,
    },
  ])
  items: {
    productId: Types.ObjectId;
    quantity: number;
    price: number;
  }[];

  @Prop({ required: true })
  totalAmount: number;

  @Prop({ default: 'PLACED' })
  status: 'PLACED' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
}

export const OrderSchema = SchemaFactory.createForClass(Order);
