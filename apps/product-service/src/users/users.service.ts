import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './schema/users.schema';
import {Cart, CartDocument} from '../cart/schema/cart.schema';
import {FavoriteDocument, Favorite} from '../favorites/schema/favorites.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Cart.name) private cartModel: Model<CartDocument>,
    @InjectModel(Favorite.name) private favModel: Model<FavoriteDocument>,
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


  async mergeGuestData(
    userId: string,
    guestCart: { productId: string; qty: number; price: number }[],
    guestFavourites: string[],
  ) {
    const uId = new Types.ObjectId(userId);

    /* ---------------- CART MERGE ---------------- */
    for (const item of guestCart) {
      const pId = new Types.ObjectId(item.productId);

      const existing = await this.cartModel.findOne({
        userId: uId,
        productId: pId,
      });

      if (existing) {
        existing.quantity += item.qty;
        await existing.save();
      } else {
        await this.cartModel.create({
          userId: uId,
          productId: pId,
          quantity: item.qty,
          price: item.price,
        });
      }
    }

    /* ---------------- FAVOURITES MERGE ---------------- */
    for (const productId of guestFavourites) {
      const pId = new Types.ObjectId(productId);

      const exists = await this.favModel.findOne({
        userId: uId,
        productId: pId,
      });

      if (!exists) {
        await this.favModel.create({
          userId: uId,
          productId: pId,
        });
      }
    }

    return {
      message: 'Guest cart & favourites merged successfully',
    };
  }
}

