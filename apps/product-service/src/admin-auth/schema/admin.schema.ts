import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AdminDocument = Admin & Document;

@Schema({ timestamps: true })
export class Admin {
  @Prop({ required: true})
  emailOrUserName: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  mobileNumber: string;

  @Prop({ default: 'admin' })
  role: string;
}

export const AdminSchema = SchemaFactory.createForClass(Admin);
