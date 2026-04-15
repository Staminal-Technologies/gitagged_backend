import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import{ Document, Types} from 'mongoose';

export type StockNotifyDocument = StockNotify & Document;

@Schema({ timestamps: true })
export class StockNotify {
  @Prop({ type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Product' })
  productId: Types.ObjectId;

  @Prop({ default: false })
  isNotified: boolean;
}