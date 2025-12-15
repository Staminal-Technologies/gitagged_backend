import { Controller, Get, Param, Post, Body, Put } from '@nestjs/common';
import { ProductsService } from './products-service';

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

    @Post()
    async create(@Body() body: any) {
        return this.service.create(body);
    }

    @Put(':id')
    async update(@Param('id') id: string, @Body() body: any) {
        return this.service.update(id, body);
    }
}
