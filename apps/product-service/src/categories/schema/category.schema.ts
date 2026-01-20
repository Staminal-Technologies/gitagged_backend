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

    // @Prop({ type: [String], default: [] })
    // children: string[];
}

export const CategorySchema = SchemaFactory.createForClass(Category);
