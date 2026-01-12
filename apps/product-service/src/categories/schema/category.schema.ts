import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class Category {

    @Prop({ required: true })
    name: string;

    @Prop()
    description?: string;

    @Prop()
    imageUrl?: string;

    @Prop({ default: null })
    parentId: string | null;

    // @Prop({ type: [String], default: [] })
    // children: string[];
}

export const CategorySchema = SchemaFactory.createForClass(Category);
