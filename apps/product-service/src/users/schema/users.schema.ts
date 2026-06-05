import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { UserStatus } from '../../enum/user-status.enum';

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
      label:{ type: String, required: true},
      receiverName:{ type: String, required: true},
      receiverPhone:{ type: String, required : true},
      addressLine: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
      isDefault: { type: Boolean, default: false },
    },
  ])
  address: {
    label: string;
    receiverName: string;
    receiverPhone: string;
    addressLine: string;
    city?: string;
    state?: string;
    pincode?: string;
    lat: number;
    lng: number;
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
