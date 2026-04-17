import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, Document } from 'mongoose';

export type FavoriteDocument = Favorite & Document;

@Schema({ timestamps: true })
export class Favorite {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    userId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
    productId: Types.ObjectId;

    @Prop({ type: [String], default: [] })
    variants: string[];
}

export const FavoriteSchema = SchemaFactory.createForClass(Favorite);

// 🚫 Prevent duplicate favorites
FavoriteSchema.index(
    { userId: 1, productId: 1, variants: 1 },
    { unique: true }
);
