import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schema/users.schema';
import { FavoritesService } from '../favorites/favorites.service';
import { CartService } from '../cart/cart.service';
import { UserStatus } from '../enum/user-status.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private cartService: CartService,
    private favoritesService: FavoritesService,
  ) { }
  findAll() {
    return this.userModel.find().lean();
  }

  findById(id: string) {
    return this.userModel.findById(id).lean();
  }

  async registerOrLogin(data: {
    name: string;
    phone: string;
    email: string;
    address: any[];
  }) {

    let user = await this.userModel.findOne({ phone: data.phone });

    if (!user) {
      // Create new user
      user = await this.userModel.create({
        name: data.name,
        phone: data.phone,
        email: data.email,
        address: data.address,
        role: UserStatus.USER,
      });
    }

    return user;
  }

  findByPhone(phone: string) {
    return this.userModel.findOne({ phone }).lean();
  }

  findByEmail(email: string) {
    return this.userModel.findOne({ email });
  }

  // merge guest cart and favourites after user login..
  async mergeGuestData(
    userId: string,
    guestCart: { productId: string; qty: number; variants: string[] }[],
    guestFavourites: { productId: string, variants: string[] }[],
  ) {
    await this.cartService.mergeGuestCart(userId, guestCart.map(item => ({
      productId: item.productId,
      qty: item.qty,
      variant: item.variants || [],
    })));
    await this.favoritesService.mergeGuestFavorites(userId, guestFavourites);

    return {
      message: 'Guest cart & favourites merged successfully',
    };
  }

  async getAllUsersForAdmin() {
    return this.userModel.find().sort({ createdAt: -1 }).lean();
  }

  async blockUser(userId: string) {
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { isBlocked: true, isActive: false },
      { new: true },
    );
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async unblockUser(userId: string) {
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { isBlocked: false, isActive: true },
      { new: true },
    );

    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(userId: string, data: {
    name: string;
    email: string;
    address: any;
  }) {
    let user = await this.userModel.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.name = data.name;
    user.email = data.email;
    if (data.address) {
      user.address = data.address;
    }

    return user.save();
  }

  async addAddress(userId: string, addressData: any) {
    const user = await this.userModel.findById(userId);

    if (!user) throw new NotFoundException('User not found');

    // ✅ Add new address
    const exists = user.address.some(
      a =>
        a.addressLine === addressData.addressLine &&
        a.pincode === addressData.pincode
    );

    if (!exists) {
      user.address.push({
        ...addressData,
        isDefault: user.address.length === 0,
      });
    }
    await user.save();

    return {
      message: 'Address added successfully',
      addresses: user.address,
    };
  }

  async getAddresses(userId: string) {
    const user = await this.userModel.findById(userId).lean();
    return user?.address || [];
  }

}

