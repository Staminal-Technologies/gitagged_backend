import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { OtpLoginDto } from './dto/otpLogin.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  // @Post('register')
  // register(@Body() dto: any) {
  //   return this.authService.register(dto);
  // }

  // @Post('login')
  // login(@Body('phone') phone: string) {
  //   return this.authService.checkPhone(phone);
  // }

  @Post('otp-login')
  async otpLogin(@Body() body :OtpLoginDto) {
    return this.authService.otpLogin(body);
  }


}
