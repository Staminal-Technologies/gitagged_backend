import { Controller, Get, Req, UseGuards, Param, Post, Body, Patch } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserJwtGuard } from '../common/guards/user-jwt.guard';
import { AdminJwtGuard } from '../common/guards/admin-jwt.guard';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) { }

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
    const userId = req.user.sub; // from JWT
    return this.usersService.mergeGuestData(
      userId,
      body.cart || [],
      body.favourites || []
    );
  }

  @UseGuards(AdminJwtGuard)
  @Get('users')
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

}
