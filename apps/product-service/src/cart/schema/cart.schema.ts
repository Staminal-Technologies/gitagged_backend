import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CartDocument = Cart & Document;

@Schema({ timestamps: true })
export class Cart {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop([
    {
      productId: { type: Types.ObjectId, ref: 'Product', required: true },
      sellerId: { type: Types.ObjectId, ref: 'Seller', required: true },
      variant: { type: [String], default: [] },
      quantity: { type: Number, required: true, min: 1 },
      price: { type: Number, required: true },
      originalPrice: { type: Number, required: true },
      discount: { type: Number, required: true },
    }
  ])
  items: {
    productId: Types.ObjectId;
    sellerId: Types.ObjectId;
    variant: string[];
    quantity: number;
    price: number;
    originalPrice: number;
    discount: number;
  }[];

}

export const CartSchema = SchemaFactory.createForClass(Cart);
