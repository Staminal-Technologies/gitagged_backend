import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  phone: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  address: string;

  // 🔐 Admin control
  @Prop({ type: Boolean, default: false })
  isBlocked: boolean;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  // 🔑 Authorization
  @Prop({ default: 'user' })
  role: 'user' | 'admin';

}

export const UserSchema = SchemaFactory.createForClass(User);
