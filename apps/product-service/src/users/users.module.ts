import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schema/users.schema';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { CartModule } from '../cart/cart.module';
import { FavoritesModule as FavouritesModule } from '../favorites/favorites.module';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';
import { FirebaseService } from '../common/firebase/firebase.service';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from '../auth/jwt.strategy';

@Module({
  imports: [MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    PassportModule,
    JwtModule,
    CartModule,
    FavouritesModule,
    AdminAuthModule,
  ],
  providers: [UsersService, FirebaseService, JwtStrategy],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule { }
