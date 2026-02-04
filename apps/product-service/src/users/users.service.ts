import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schema/users.schema';
import { FavoritesService } from '../favorites/favorites.service';
import { CartService } from '../cart/cart.service';

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

  create(data: Partial<User>) {
    return this.userModel.create(data);
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
    guestCart: { productId: string; qty: number; price: number }[],
    guestFavourites: string[],
  ) {
    await this.cartService.mergeGuestCart(userId, guestCart);
    await this.favoritesService.mergeGuestFavorites(userId, guestFavourites);

    return {
      message: 'Guest cart & favourites merged successfully',
    };
  }

  async getAllUsersForAdmin() {
    return this.userModel.find().sort({ createdAt: -1 }).lean();
  }

  async blockUser(userId: string) {
    return this.userModel.findByIdAndUpdate(
      userId,
      { isBlocked: true },
      { new: true },
    );
  }

  async unblockUser(userId: string) {
    return this.userModel.findByIdAndUpdate(
      userId,
      { isBlocked: false },
      { new: true },
    );
  }

}

