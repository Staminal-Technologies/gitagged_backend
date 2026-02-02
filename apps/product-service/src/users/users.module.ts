import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schema/users.schema';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { CartModule } from '../cart/cart.module';
import { FavoritesModule as FavouritesModule } from '../favorites/favorites.module';

@Module({
  imports: [MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
 CartModule,        
    FavouritesModule,  
],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule { }
