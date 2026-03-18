import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderStatus } from './order-status.enum';
import { AdminJwtGuard } from '../common/guards/admin-jwt.guards';

@Controller('admin/orders')
@UseGuards(AdminJwtGuard)
export class AdminOrdersController {
  constructor(private readonly orderService: OrderService) {}

  @Get()
  getAllOrders(@Req() req: any) {
    return this.orderService.getAllOrders(req.user);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: OrderStatus },
    token : string
  ) {
    return this.orderService.updateOrderStatus(id, body.status,token);
  }
}
