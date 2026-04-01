import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Seller, SellerDocument } from './schema/seller.schema';
import { approvalStatus } from './seller-status.enum';
import { User, UserDocument } from '../common/schema/user.schema';
import { UserStatus } from '../common/enum/user-status.enum';
import * as bcrypt from 'bcryptjs';
import { MailService } from '../common/mail/mail.service';

@Injectable()
export class SellerService {
  constructor(
    @InjectModel(Seller.name) private sellerModel: Model<SellerDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private mailService:MailService,
  ) { }

  // 🟢 USER APPLY TO BECOME SELLER
  async applySeller(userId: string, data: any) {

    const existing = await this.sellerModel.findOne({ userId });

    if (existing) {
      throw new BadRequestException('Seller request already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const seller = await this.sellerModel.create({
      userId,
      ...data,
      password: hashedPassword,
      status: 'PENDING',
    });

    await this.mailService.sendSellerRequestEmail(seller);

    return {
      message: 'Seller application submitted successfully',
      seller,
    };
  }

  // 🟢 GET MY SELLER PROFILE
  async getMySellerProfile(userId: string) {
    const seller = await this.sellerModel.findOne({ userId });

    if (!seller) throw new NotFoundException('Seller profile not found');

    return seller;
  }

  // 🟢 ADMIN GET ALL SELLERS
  async getAllSellers() {
    return this.sellerModel
      .find()
      .populate('userId', 'name phone email')
      .sort({ createdAt: -1 });
  }

  // update seller status
  async updateSellerStatus(sellerId: string, status: string) {
    const seller = await this.sellerModel.findById(sellerId);

    if (!seller) throw new NotFoundException('Seller not found');

    seller.status = status as approvalStatus;
    seller.isActive = status === 'APPROVED';

    await seller.save();

    if (status === 'APPROVED') {
      await this.userModel.findByIdAndUpdate(seller.userId, {
        role: UserStatus.SELLER,
      });
    }

    return { message: 'Status updated successfully' };
  }
}