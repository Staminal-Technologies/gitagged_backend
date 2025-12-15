import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class Product {
    @Prop({ type: String, required: true })
    _id: string; // slug ID like prod-mysore-silk-saree-01

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

    @Prop({ type: [String], default: [] })
    categories: string[];

    @Prop({ type: [String], default: [] })
    giRegions: string[];

    @Prop({ default: 'active' })
    status: string; // active | inactive

    @Prop({ default: 0 })
    rating: number;

    @Prop({ default: 0 })
    reviewCount: number;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
export type ProductDocument = Product;
