import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Product {
    @Prop({ required: true, unique: true })
    slug: string; // slug ID like prod-mysore-silk-saree-01

    @Prop({ type: Types.ObjectId, ref: 'Seller', required: true })
    sellerId: Types.ObjectId;

    @Prop({ required: true })
    title: string;

    @Prop()
    description?: string;

    @Prop({ required: true })
    price: number;

    @Prop()
    mrp?: number;

    @Prop()
    discountPercentage?: number;

    @Prop({ type: Number, default: 0 })
    stock: number;

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

    @Prop({ default: 'active' })
    status: string; // active | inactive

    @Prop({ default: 0 })
    rating: number;

    @Prop({ default: 0 })
    reviewCount: number;

    @Prop({ default: false })
    isApproved: boolean;

    @Prop({ type: Object, default: null })
    pendingUpdates: any;

    @Prop({ default: false })
    isUpdatePending: boolean;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
export type ProductDocument = Product;
