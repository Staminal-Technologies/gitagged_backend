import { Controller, Get, Req, UseGuards, Param, Post, Body, Patch } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtService } from '@nestjs/jwt';
import { UserJwtGuard } from '../common/guards/user-jwt.guard';
import { AdminJwtGuard } from '../common/guards/admin-jwt.guard';
import { FirebaseService } from '../common/firebase/firebase.service';

@Controller('users')
export class UsersController {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private firebaseService: FirebaseService,
  ) { }

  @UseGuards(AdminJwtGuard)
  @Get()
  getAllUsers() {
    return this.usersService.findAll();
  }

  @Get('me')
  @UseGuards(UserJwtGuard)
  getMe(@Req() req: any) {
    return this.usersService.findByPhone(req.user.phone);
  }

  @Get(':id')
  getUser(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Post('merge')
  @UseGuards(UserJwtGuard)
  async mergeGuestData(
    @Req() req,
    @Body() body: { cart: any[]; favourites: string[] }
  ) {
    console.log("MERGE USER 👉", req.user);
    const userId = req.user.sub; // from JWT

    if (!userId) {
      throw new Error("User not found in JWT");
    }
    return this.usersService.mergeGuestData(
      userId,
      body.cart || [],
      body.favourites || []
    );
  }

  @UseGuards(AdminJwtGuard)
  @Get()
  getAllUsersAdmin() {
    return this.usersService.getAllUsersForAdmin();
  }

  @UseGuards(AdminJwtGuard)
  @Patch(':id/block')
  block(@Param('id') id: string) {
    return this.usersService.blockUser(id);
  }

  @UseGuards(AdminJwtGuard)
  @Patch(':id/unblock')
  unblock(@Param('id') id: string) {
    return this.usersService.unblockUser(id);
  }

  @UseGuards(UserJwtGuard)
  @Patch('me')
  updateProfile(@Req() req, @Body() body: {
    name: string;
    email: string;
    address: string[];
  }) {
    return this.usersService.updateProfile(req.user.sub, body);
  }

  @Post('complete-profile')
  async completeProfile(
    @Body() body: {
      firebaseToken: string;
      name: string;
      email: string;
      address: string[];
    }
  ) {
    const decoded = await this.firebaseService.verifyToken(body.firebaseToken);
    const phone = decoded.phone_number;

    const user = await this.usersService.registerOrLogin({
      phone,
      name: body.name,
      email: body.email,
      address: body.address,
    });

    const jwt = this.jwtService.sign({
      sub: user._id,
      phone: user.phone,
      role: user.role,
    });

    return { token: jwt, user };
  }

}
