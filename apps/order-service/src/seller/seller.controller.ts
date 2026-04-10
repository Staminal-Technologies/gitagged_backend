import { Controller, Post, Get, Patch, Param, Body, Req, UseGuards } from '@nestjs/common';
import { SellerService } from './seller.service';
import { UserJwtGuard } from '../common/guards/user-jwt.guards';
import { AdminJwtGuard } from '../common/guards/admin-jwt.guards';

@Controller('sellers')
export class SellerController {
  constructor(private readonly sellerService: SellerService) { }

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
    // return this.sellerService.approveSeller(id);
    return this.sellerService.updateSellerStatus(id, 'APPROVED');
  }

  // 🔴 ADMIN REJECT
  @UseGuards(AdminJwtGuard)
  @Patch(':id/reject')
  reject(@Param('id') id: string) {
    // return this.sellerService.rejectSeller(id);
    return this.sellerService.updateSellerStatus(id, 'REJECTED');
  }

  @UseGuards(AdminJwtGuard)
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string }
  ) {
    return this.sellerService.updateSellerStatus(id, body.status);
  }
}