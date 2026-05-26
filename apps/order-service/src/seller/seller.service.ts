import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Seller, SellerDocument } from './schema/seller.schema';
import { approvalStatus } from './seller-status.enum';
import { User, UserDocument } from 'apps/product-service/src/users/schema/users.schema';
import { UserStatus } from '../common/enum/user-status.enum';
import * as bcrypt from 'bcryptjs';
import { MailService } from '../common/mail/mail.service';

@Injectable()
export class SellerService {
  constructor(
    @InjectModel(Seller.name) private sellerModel: Model<SellerDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private mailService: MailService,
  ) { }

  // 🟢 USER APPLY TO BECOME SELLER
  async applySeller(userId: string, data: any) {

    const existing = await this.sellerModel.findOne({ userId });

    if (existing) {
      throw new BadRequestException('Seller request already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const existingEmail =
      await this.sellerModel.findOne({
        email: data.email
      });

    if (existingEmail) {
      throw new BadRequestException(
        'Email already exists'
      );
    }

    const existingMobile =
      await this.sellerModel.findOne({
        mobileNumber: data.mobileNumber
      });

    if (existingMobile) {
      throw new BadRequestException(
        'Mobile number already exists'
      );
    }

    const existingGST =
      await this.sellerModel.findOne({
        gstNumber: data.gstNumber
      });

    if (existingGST) {
      throw new BadRequestException(
        'GST number already exists'
      );
    }

    const existingPAN =
      await this.sellerModel.findOne({
        panNumber: data.panNumber
      });

    if (existingPAN) {
      throw new BadRequestException(
        'PAN number already exists'
      );
    }

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
  async updateSellerStatus(sellerId: string, status: string, reason?: string) {
    if (
      status === 'REJECTED' &&
      (!reason || reason.trim() === '')
    ) {
      throw new BadRequestException(
        'Rejection reason required'
      );
    }

    const seller = await this.sellerModel.findById(sellerId);

    if (!seller) throw new NotFoundException('Seller not found');

    seller.status = status as approvalStatus;
    seller.profileUpdateStatus = status;

    seller.rejectionReason =
      status === 'REJECTED'
        ? reason
        : null;

    seller.isActive = status === 'APPROVED';

    if (status === 'APPROVED') {
      seller.rejectionReason = null;
      await this.userModel.findByIdAndUpdate(seller.userId, {
        role: UserStatus.SELLER,
      });
    }

    await seller.save();

    return { message: 'Status updated successfully' };
  }

  async updateSellerProfile(userId: string, data: any) {

    const seller = await this.sellerModel.findOne({ userId });

    if (!seller) {
      throw new NotFoundException('Seller not found');
    }

    // DIRECT UPDATE FIELDS
    seller.address =
      data.address || seller.address;

    seller.productDescription =
      data.productDescription ||
      seller.productDescription;

    // Validation for the unique fields!!
    if (
      data.email &&
      data.email !== seller.email
    ) {

      const existingEmail =
        await this.sellerModel.findOne({
          email: data.email
        });

      if (existingEmail) {
        throw new BadRequestException(
          'Email already exists'
        );
      }
    }

    if (
      data.mobileNumber &&
      data.mobileNumber !== seller.mobileNumber
    ) {

      const existingMobile =
        await this.sellerModel.findOne({
          mobileNumber: data.mobileNumber
        });

      if (existingMobile) {
        throw new BadRequestException(
          'Mobile number already exists'
        );
      }
    }

    if (
      data.gstNumber &&
      data.gstNumber !== seller.gstNumber
    ) {

      const existingGST =
        await this.sellerModel.findOne({
          gstNumber: data.gstNumber
        });

      if (existingGST) {
        throw new BadRequestException(
          'GST already exists'
        );
      }
    }

    if (
      data.panNumber &&
      data.panNumber !== seller.panNumber
    ) {

      const existingPAN =
        await this.sellerModel.findOne({
          panNumber: data.panNumber
        });

      if (existingPAN) {
        throw new BadRequestException(
          'PAN already exists'
        );
      }
    }

    // ADMIN APPROVAL REQUIRED FIELDS
    seller.pendingProfileUpdates = {
      mobileNumber: data.mobileNumber,
      email: data.email,
      businessName: data.businessName,
      gstNumber: data.gstNumber,
      panNumber: data.panNumber,
      bankAccountNumber: data.bankAccountNumber,
      ifscCode: data.ifscCode,
      accountHolderName: data.accountHolderName,
      digitalSignatureUrl: data.digitalSignatureUrl,

    };

    seller.isProfileUpdatePending = true;

    seller.profileUpdateStatus = 'PENDING';

    await seller.save();

    return {
      message:
        'Profile update submitted for admin approval',
    };
  }

  async approveProfileUpdate(sellerId: string) {

    const seller = await this.sellerModel.findById(sellerId);

    if (!seller) {
      throw new NotFoundException('Seller not found');
    }

    if (!seller.pendingProfileUpdates) {
      throw new BadRequestException(
        'No pending profile updates'
      );
    }

    Object.assign(
      seller,
      seller.pendingProfileUpdates
    );

    seller.pendingProfileUpdates = null;

    seller.isProfileUpdatePending = false;

    seller.profileUpdateStatus = 'APPROVED';

    seller.rejectionReason = null;

    await seller.save();

    return {
      message:
        'Profile updates approved successfully',
    };
  }

  async rejectProfileUpdate(
    sellerId: string,
    reason: string
  ) {

    const seller = await this.sellerModel.findById(sellerId);

    if (!seller) {
      throw new NotFoundException('Seller not found');
    }

    seller.profileUpdateStatus = 'REJECTED';

    seller.rejectionReason = reason;

    seller.isProfileUpdatePending = false;

    seller.pendingProfileUpdates = null;

    await seller.save();

    return {
      message:
        'Profile update rejected',
    };
  }

  async blockSeller(id: string) {
    return this.sellerModel.findByIdAndUpdate(
      id,
      { isBlocked: true },
      { new: true }
    );
  }

  async unblockSeller(id: string) {
    return this.sellerModel.findByIdAndUpdate(
      id,
      { isBlocked: false },
      { new: true }
    );
  }
}