import { Body, Controller, Post, Get, Req, UseGuards } from '@nestjs/common';
import { SellerAuthService } from './seller-auth.service';

@Controller('seller-auth')
export class SellerAuthController {

  constructor(private service: SellerAuthService) { }

  @Post('login')
  login(@Body() body: any) {
    return this.service.login(body.identifier, body.password);
  }
}