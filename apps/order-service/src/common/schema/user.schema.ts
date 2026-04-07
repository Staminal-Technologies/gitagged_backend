import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { UserStatus } from '../enum/user-status.enum';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  phone: string;

  @Prop({ required: false })
  email: string;

  @Prop([
    {
      addressLine: { type: String, required: true },
      city: { type: String },
      state: { type: String },
      pincode: { type: String },
      isDefault: { type: Boolean, default: false },
    },
  ])
  address: {
    addressLine: string;
    city?: string;
    state?: string;
    pincode?: string;
    isDefault?: boolean;
  }[];

  @Prop({ type: Boolean, default: false })
  isBlocked: boolean;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  @Prop({ type: String, enum: UserStatus, default: UserStatus.USER })
  role: UserStatus;
}

export const UserSchema = SchemaFactory.createForClass(User);

