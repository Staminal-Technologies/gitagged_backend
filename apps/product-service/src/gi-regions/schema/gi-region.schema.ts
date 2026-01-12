import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema, Types } from 'mongoose';

@Schema({ timestamps: true })
export class GIRegion {

    @Prop({ required: true })
    name: string;

    @Prop()
    description?: string;

    @Prop()
    state?: string; 

    @Prop()
    certificateNumber?: string;

    @Prop()
    imageUrl?: string;

    // @Prop({ type: [String], default: [] })
    // categories: string[];  // link to Category IDs

    @Prop({
        type: [MongooseSchema.Types.ObjectId],
        ref: 'Category',
        default: [],
    })
    categories: Types.ObjectId[];

    @Prop({ default: 0 })
    popularityScore: number;
}

export const GIRegionSchema = SchemaFactory.createForClass(GIRegion);
