import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class GIRegion {
    @Prop({ type: String, required: true })
    _id: string;

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

    @Prop({ type: [String], default: [] })
    categories: string[];  // link to Category IDs

    @Prop({ default: 0 })
    popularityScore: number;
}

export const GIRegionSchema = SchemaFactory.createForClass(GIRegion);
