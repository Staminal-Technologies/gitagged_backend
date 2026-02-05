import { Controller, Post, Get, Req, UseGuards , Param, Patch, Body } from '@nestjs/common';
import { OrderService } from './order.service';
import { UserJwtGuard } from '../common/guards/user-jwt.quards';
import { OrderStatus } from './order-status.enum';

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

  @Get()
  getAllOrders() {
    return this.orderService.getAllOrdersForAdmin();
  }

  @Get(':id')
  getOrder(@Param('id') id: string) {
    return this.orderService.getOrderById(id);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: OrderStatus },
  ) {
    return this.orderService.updateOrderStatus(id, body.status);
  }
}
