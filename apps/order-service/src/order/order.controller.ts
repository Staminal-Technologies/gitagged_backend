import { Controller, Post, Get, Req, UseGuards } from '@nestjs/common';
import { OrderService } from './order.service';
import { UserJwtGuard } from '../common/guards/user-jwt.quards';

@Controller('orders')
@UseGuards(UserJwtGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post() 
  placeOrder(@Req() req) {
    return this.orderService.placeOrder(
      req.user.sub,
      req.headers.authorization,
    );
  }

  @Get()
  getMyOrders(@Req() req) {
    return this.orderService.getMyOrders(req.user.sub);
  }
}
