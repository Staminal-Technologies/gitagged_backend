import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { UserJwtGuard } from '../common/guards/user-jwt.guard';

@Controller('favorites')
@UseGuards(UserJwtGuard)
export class FavoritesController {
  constructor(private readonly service: FavoritesService) {}

  @Post(':productId')
  add(@Req() req, @Param('productId') productId: string) {
    return this.service.add(req.user.sub, productId);
  }

  @Get()
  getMyFavorites(@Req() req) {
    return this.service.getMyFavorites(req.user.sub);
  }

  @Delete(':productId')
  remove(@Req() req, @Param('productId') productId: string) {
    return this.service.remove(req.user.sub, productId);
  }
}
