import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schema/users.schema';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { CartModule } from '../cart/cart.module';
import { FavoritesModule as FavouritesModule } from '../favorites/favorites.module';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';
import { FirebaseService } from '../common/firebase/firebase.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    CartModule,
    FavouritesModule,
    AdminAuthModule,
  ],
  providers: [UsersService, FirebaseService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule { }
