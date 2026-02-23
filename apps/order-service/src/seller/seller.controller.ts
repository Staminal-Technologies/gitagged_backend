import { Controller, Post, Get, Patch, Param, Body, Req, UseGuards } from '@nestjs/common';
import { SellerService } from './seller.service';
import { UserJwtGuard } from 'apps/product-service/src/common/guards/user-jwt.guard';
import { AdminJwtGuard } from 'apps/product-service/src/common/guards/admin-jwt.guard';

@Controller('sellers')
export class SellerController {
  constructor(private readonly sellerService: SellerService) {}

  // 🟢 USER APPLY
  @UseGuards(UserJwtGuard)
  @Post('apply')
  applySeller(@Req() req, @Body() body: any) {
    return this.sellerService.applySeller(req.user.sub, body);
  }

  // 🟢 USER VIEW OWN SELLER PROFILE
  @UseGuards(UserJwtGuard)
  @Get('me')
  getMySeller(@Req() req) {
    return this.sellerService.getMySellerProfile(req.user.sub);
  }

  // 🟢 ADMIN VIEW ALL SELLERS
  @UseGuards(AdminJwtGuard)
  @Get()
  getAll() {
    return this.sellerService.getAllSellers();
  }

  // 🟢 ADMIN APPROVE
  @UseGuards(AdminJwtGuard)
  @Patch(':id/approve')
  approve(@Param('id') id: string) {
    return this.sellerService.approveSeller(id);
  }

  // 🔴 ADMIN REJECT
  @UseGuards(AdminJwtGuard)
  @Patch(':id/reject')
  reject(@Param('id') id: string) {
    return this.sellerService.rejectSeller(id);
  }
}