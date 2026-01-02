import { Type } from '@nestjs/common';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema,Types } from 'mongoose';

@Schema({ timestamps: true })
export class Product {
    @Prop({ required: true, unique: true })
    slug: string; // slug ID like prod-mysore-silk-saree-01

    @Prop({ required: true })
    title: string;

    @Prop()
    description?: string;

    @Prop({ required: true })
    price: number;

    @Prop()
    mrp?: number;

    @Prop()
    discountPercent?: number;

    @Prop({ type: Number, default: 0 })
    stock: number;

    @Prop({ type: [String], default: [] })
    images: string[];

    @Prop({ type: [MongooseSchema.Types.ObjectId],ref:'Category', default: [] })
    categories: Types.ObjectId[];

    @Prop({ type: [MongooseSchema.Types.ObjectId],ref:'GIRegion', default: [] })
    giRegions: Types.ObjectId[];

    @Prop({ default: 'active' })
    status: string; // active | inactive

    @Prop({ default: 0 })
    rating: number;

    @Prop({ default: 0 })
    reviewCount: number;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
export type ProductDocument = Product;
