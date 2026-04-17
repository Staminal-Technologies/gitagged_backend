import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CategoryDocument = Category & Document;

@Schema({ timestamps: true })
export class Category {

    @Prop({ required: true })
    name: string;

    @Prop()
    description?: string;

    @Prop()
    image?: string;

    @Prop({ default: null })
    parentId: string | null;

    @Prop({ default: false })
    requiresExpiry: boolean;

    @Prop({ default: false })
    requiresReturnPolicy: boolean;
}

export const CategorySchema = SchemaFactory.createForClass(Category);
