import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { OtpLoginDto } from './dto/otpLogin.dto';
import { FirebaseService } from '../common/firebase/firebase.service';

@Controller('auth')
export class AuthController {
  constructor(
    private firebaseService: FirebaseService,
    private authService: AuthService) { }

  // @Post('register')
  // register(@Body() dto: any) {
  //   return this.authService.register(dto);
  // }

  // @Post('login')
  // login(@Body('phone') phone: string) {
  //   return this.authService.checkPhone(phone);
  // }

  @Post('otp-login')
  async otpLogin(@Body() body: OtpLoginDto) {
    return this.authService.otpLogin(body);
  }

  @Post('login')
  login(@Body() body: any) {
    return this.authService.login(body.email, body.password);
  }

  @Post('verify-otp')
  async verifyOtp(@Body() body: { idToken: string }) {

    const decoded = await this.firebaseService.verifyToken(body.idToken);

    return {
      message: 'OTP verified successfully',
      phoneNumber: decoded.phone_number,
    };
  }

  // @Post('reset-password')
  // async resetPassword(
  //   @Body() body: {
  //     phone: string;
  //     newPassword: string;
  //   },
  // ) {
  //   return this.authService.resetPassword(body.phone, body.newPassword);
  // }

  @Post('reset-password')
  async resetPassword(
    @Body() body: {
      idToken: string;
      newPassword: string;
    },
  ) {
    const decoded = await this.firebaseService.verifyToken(body.idToken);

    let phone = decoded.phone_number;

    // Remove +91 if exists
    if (phone.startsWith('+91')) {
      phone = phone.replace('+91', '');
    }

    return this.authService.resetPassword(phone, body.newPassword);
  }

}
