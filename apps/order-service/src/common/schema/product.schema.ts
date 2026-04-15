import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true, unique: true })
  slug: string;

  @Prop({ type: Types.ObjectId, ref: 'Seller', required: true })
  sellerId: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop()
  description?: string;

  @Prop([
    {
      name: String, 
      options: [String], 
    },
  ])
  variantOptions: {
    name: string;
    options: string[];
  }[];

  @Prop([
    {
      values: [String],
      price: Number,
      mrp: Number,
      stock: Number,
      sku: String,
    },
  ])
  variants: {
    values: string[];
    price: number;
    mrp?: number;
    stock: number;
    sku?: string;
  }[];

  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop({
    type: Map,
    of: String,
    default: {},
  })
  attributes: Record<string, string>;

  @Prop({ type: [MongooseSchema.Types.ObjectId], ref: 'Category', default: [] })
  categories: Types.ObjectId[];

  @Prop({ type: [MongooseSchema.Types.ObjectId], ref: 'GIRegion', default: [] })
  giRegions: Types.ObjectId[];

  @Prop({ default: 0 })
  discountPercentage?: number;

  @Prop({ default: 'inactive' })
  status: string;

  @Prop({ default: 0 })
  rating: number;

  @Prop({ default: 0 })
  reviewCount: number;

  @Prop({ default: 'PENDING' })
  approveStatus: string;

  @Prop({ type: Object, default: null })
  pendingUpdates: any;

  @Prop({ default: false })
  isUpdatePending: boolean;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
export type ProductDocument = Product;