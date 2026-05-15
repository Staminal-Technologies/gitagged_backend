// import {
//   Controller,
//   Post,
//   Get,
//   Delete,
//   Param,
//   Req,
//   UseGuards,
//   Body,
// } from '@nestjs/common';
// import { FavoritesService } from './favorites.service';
// import { UserJwtGuard } from '../common/guards/user-jwt.guard';

// @Controller('favorites')
// @UseGuards(UserJwtGuard)
// export class FavoritesController {
//   constructor(private readonly service: FavoritesService) { }

//   @Post(':productId')
//   add(@Req() req, @Param('productId') productId: string, @Body('variants') variants: string[]) {
//     return this.service.add(req.user.sub, productId, variants);
//   }

//   @Get()
//   getMyFavorites(@Req() req) {
//     return this.service.getMyFavorites(req.user.sub);
//   }

//   @Delete(':productId')
//   remove(@Req() req, @Param('productId') productId: string, @Body('variants') variants: string[]) {
//     return this.service.remove(req.user.sub, productId, variants);
//   }

// }

import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Req,
  UseGuards,
  Query,
} from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { UserJwtGuard } from '../common/guards/user-jwt.guard';

@Controller('favorites')
@UseGuards(UserJwtGuard)
export class FavoritesController {
  constructor(private readonly service: FavoritesService) { }

  @Post(':productId')
  add(
    @Req() req,
    @Param('productId') productId: string,
    @Query('variants') variants?: string
  ) {
    const variantValues = variants ? variants.split(',') : [];
    return this.service.add(req.user.sub, productId, variantValues);
  }

  @Get()
  getMyFavorites(@Req() req) {
    return this.service.getMyFavorites(req.user.sub);
  }

  @Delete(':productId')
  remove(
    @Req() req,
    @Param('productId') productId: string,
    @Query('variants') variants?: string,
  ): Promise<{ deletedCount?: number }> {

    const variantValues =
      variants ? variants.split(',') : [];

    return this.service.remove(
      req.user.sub,
      productId,
      variantValues,
    );
  }
}
