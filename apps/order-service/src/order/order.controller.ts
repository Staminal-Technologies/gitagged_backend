import { Controller, Post, Get, Req, UseGuards, Param, Patch, Body } from '@nestjs/common';
import { OrderService } from './order.service';
import { UserJwtGuard } from '../common/guards/user-jwt.guards';
import { OrderStatus } from './order-status.enum';
import { AdminJwtGuard } from '../common/guards/admin-jwt.guards';
import { SellerJwtGuard } from '../common/guards/seller-jwt.guards';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) { }

  @UseGuards(UserJwtGuard)
  @Post()
  placeOrder(@Req() req, @Body() body: any) {
    return this.orderService.placeOrder(
      req.user.sub,
      req.headers.authorization,
      body,
    );
  }

  @UseGuards(UserJwtGuard)
  @Get()
  getMyOrders(@Req() req) {
    return this.orderService.getMyOrders(req.user.sub);
  }

  @UseGuards(AdminJwtGuard)
  @Get('admin/all')
  getAllOrders(@Req() req) {
    return this.orderService.getAllOrders(req.user);
  }

  @UseGuards(UserJwtGuard)
  @Get(':id')
  getOrder(
    @Param('id') id: string,
    @Req() req,
  ) {
    return this.orderService.getOrderById(
      id,
      req.user,
    );
  }

  @UseGuards(SellerJwtGuard)
  @Patch('item/:itemId/status')
  updateItemStatus(
    @Param('itemId') itemId: string,
    @Body() body: { status: OrderStatus },
    @Req() req,
  ) {
    return this.orderService.updateItemStatus(
      itemId,
      body.status,
      req.user.sellerId
    );
  }

  @UseGuards(SellerJwtGuard)
  @Get('seller/all')
  getSellerOrders(@Req() req) {
    return this.orderService.getAllOrders(req.user);
  }

  // return controllers!!
  @Patch(':id/return')
  @UseGuards(UserJwtGuard)
  returnOrder(@Param('id') id: string, @Req() req) {
    return this.orderService.returnOrder(id, req.user.sub, req.headers.authorization);
  }

  @Patch(':id/replace')
  @UseGuards(UserJwtGuard)
  replaceOrder(@Param('id') id: string, @Req() req) {
    return this.orderService.replaceOrder(id, req.user.sub, req.headers.authorization);
  }
}
