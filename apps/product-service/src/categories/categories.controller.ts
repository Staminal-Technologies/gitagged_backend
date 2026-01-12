import { Controller, Get, UseGuards, Put, Post, Body, Param, Delete } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { AdminJwtGuard } from '../common/guards/admin-jwt.guard';
@Controller('categories')
export class CategoriesController {

  constructor(private readonly service: CategoriesService) {}

  @Get()
  getAll() {
    return this.service.findAll();
  }

  @UseGuards(AdminJwtGuard)
  @Post()
  create(@Body() body: any) {
    return this.service.create(body);
  }

  @UseGuards(AdminJwtGuard)
  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.service.update(id, body);
  }

  @UseGuards(AdminJwtGuard)
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }

}
