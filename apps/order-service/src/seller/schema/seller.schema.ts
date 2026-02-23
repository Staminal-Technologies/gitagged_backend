import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, Document } from 'mongoose';
import { roleStatus } from 'apps/product-service/src/admin-auth/admin-auth.enum';
import { approvalStatus } from '../seller-status.enum';

export type SellerDocument = Seller & Document;

@Schema({ timestamps: true })
export class Seller {

  // 🔗 Link to user account
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  businessName: string;

  @Prop({ required: true })
  businessType: string;

  @Prop({ required: true })
  gstNumber: string;

  @Prop({ required: true })
  panNumber: string;

  @Prop({ required: true })
  bankAccountNumber: string;

  @Prop({ required: true })
  ifscCode: string;

  @Prop({ required: true })
  accountHolderName: string;

  @Prop({ required: true })
  mobileNumber: string;

  @Prop()
  digitalSignatureUrl: string;

  @Prop({ type: String, enum: approvalStatus, default: approvalStatus.PENDING })
  status: approvalStatus;

  @Prop({ default: false })
  isActive: boolean;

  @Prop({ type: String, enum: roleStatus, default: roleStatus.SELLER })
  role: roleStatus;
}

export const SellerSchema = SchemaFactory.createForClass(Seller);