import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { roleStatus } from '../admin-auth.enum';

export type AdminDocument = Admin & Document;

@Schema({ timestamps: true })
export class Admin {
  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  mobileNumber: string;

  @Prop({ required: true })
  name: string;

  @Prop({ type: String, enum: roleStatus, default: roleStatus.ADMIN })
  role: roleStatus;
}

export const AdminSchema = SchemaFactory.createForClass(Admin);
