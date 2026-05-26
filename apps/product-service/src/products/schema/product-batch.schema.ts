import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, Document } from 'mongoose';

export type ProductBatchDocument = ProductBatch & Document;

@Schema({ timestamps: true })
export class ProductBatch {

    @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
    productId: Types.ObjectId;

    // match variant (like ["1kg", "red"])
    @Prop({ type: [String], default: [] })
    variantValues: string[];

    @Prop({ required: true })
    stock: number;

    @Prop()
    expiryDate?: Date;

    @Prop({ default: false })
    lowStockAlertSent: boolean;

    // Override price and discountPercentage
    @Prop()
    priceOverride?: number;

    @Prop({ default: null })
    discountPercentageOverride?: number;

}

export const ProductBatchSchema = SchemaFactory.createForClass(ProductBatch);

ProductBatchSchema.index({ productId: 1, variantValues: 1 });