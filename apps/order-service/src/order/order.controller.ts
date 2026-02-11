import { Controller, Post, Get, Req, UseGuards, Param, Patch, Body } from '@nestjs/common';
import { OrderService } from './order.service';
import { UserJwtGuard } from '../common/guards/user-jwt.quards';
import { OrderStatus } from './order-status.enum';
import { AdminJwtGuard } from '../common/guards/admin-jwt.guards';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) { }

  @UseGuards(AdminJwtGuard)
  @Post()
  placeOrder(@Req() req) {
    return this.orderService.placeOrder(
      req.user.sub,
      req.headers.authorization,
    );
  }

  @UseGuards(UserJwtGuard)
  @Get()
  getMyOrders(@Req() req) {
    return this.orderService.getMyOrders(req.user.sub);
  }

  @UseGuards(AdminJwtGuard)
  @Get('admin/all')
  getAllOrders() {
    return this.orderService.getAllOrdersForAdmin();
  }

  @Get(':id')
  getOrder(@Param('id') id: string) {
    return this.orderService.getOrderById(id);
  }

  @UseGuards(AdminJwtGuard)
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: OrderStatus },
  ) {
    return this.orderService.updateOrderStatus(id, body.status);
  }
}
