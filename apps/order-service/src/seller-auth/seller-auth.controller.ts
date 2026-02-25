import { Body, Controller, Post , Get, Req, UseGuards} from '@nestjs/common';
import { SellerAuthService } from './seller-auth.service';
import { SellerJwtGuard } from '../common/guards/seller-jwt.guards';

@Controller('seller-auth')
export class SellerAuthController {

  constructor(private service: SellerAuthService) { }

  @Post('login')
  login(@Body() body: any) {
    return this.service.login(body.email, body.password);
  }

  // @UseGuards(SellerJwtGuard)
  // @Get('seller/orders')
  // getSellerOrders(@Req() req) {
  //   return this.service.getSellerOrders(req.user.sub);
  // }
}