import { Controller, Get, Req, UseGuards , Param, Post , Body} from '@nestjs/common';
import { UsersService } from './users.service';
// import { UserJwtGuard } from '../auth/user-jwt.guard';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

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

//   @UseGuards(UserJwtGuard)
  @Get('me')
  getMe(@Req() req: any) {
    return this.usersService.findByPhone(req.user.phone);
  }
}
