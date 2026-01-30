import { Controller, Get, Req, UseGuards, Param, Post, Body } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserJwtGuard } from '../common/guards/user-jwt.guard';
// import { UserJwtGuard } from '../auth/user-jwt.guard';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) { }

  @Get()
  getAllUsers() {
    return this.usersService.findAll();
  }

  @Get(':id')
  getUser(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Post()
  createUser(@Body() body: any) {
    return this.usersService.create(body);
  }

  // @UseGuards(UserJwtGuard)
  @Get('me')
  getMe(@Req() req: any) {
    return this.usersService.findByPhone(req.user.phone);
  }

  @Post('merge')
  // @UseGuards(UserJwtGuard)
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

}
