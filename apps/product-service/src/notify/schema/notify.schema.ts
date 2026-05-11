import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type StockNotifyDocument = StockNotify & Document;

@Schema({ timestamps: true })
export class StockNotify {

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  userId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Product',
    required: true,
  })
  productId: Types.ObjectId;

  @Prop({
    type: [String],
    default: [],
  })
  variantValues: string[];

  @Prop({ default: false })
  isNotified: boolean;
}

export const StockNotifySchema =
  SchemaFactory.createForClass(StockNotify);