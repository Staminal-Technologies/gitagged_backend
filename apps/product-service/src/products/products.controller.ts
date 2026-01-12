import { Controller, Get, Param, Post, Body, Put, UseGuards , Delete} from '@nestjs/common';
import { ProductsService } from './products.service';
import { AdminJwtGuard } from '../common/guards/admin-jwt.guard';

@Controller('products')
export class ProductsController {
    constructor(private readonly service: ProductsService) { }

    @Get()
    async getAll() {
        return this.service.findAll();
    }

    @Get(':id')
    async getOne(@Param('id') id: string) {
        return this.service.findById(id);
    }

    @Get('/category/:categoryId')
    async getByCategory(@Param('categoryId') categoryId: string) {
        return this.service.findByCategory(categoryId);
    }

    @Get('/gi/:regionId')
    async getByGI(@Param('regionId') regionId: string) {
        return this.service.findByGIRegion(regionId);
    }

      @UseGuards(AdminJwtGuard)
    @Post()
    async create(@Body() body: any) {
        return this.service.create(body);
    }

      @UseGuards(AdminJwtGuard)
    @Put(':id')
    async update(@Param('id') id: string, @Body() body: any) {
        return this.service.update(id, body);
    }

    @UseGuards(AdminJwtGuard)
@Delete(':id')
async remove(@Param('id') id: string) {
  return this.service.remove(id);
}

}
