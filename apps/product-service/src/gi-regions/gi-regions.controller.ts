import { Controller, Get, Param, Post, Body, Put } from '@nestjs/common';
import { GIRegionsService } from './gi-regions.service';

@Controller('gi-regions')
export class GIRegionsController {
    constructor(private readonly giRegionsService: GIRegionsService) { }

    @Get()
    getAll() {
        return this.giRegionsService.findAll();
    }

    @Get(':id')
    getOne(@Param('id') id: string) {
        return this.giRegionsService.findById(id);
    }

    @Post()
    create(@Body() body: any) {
        return this.giRegionsService.create(body);
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() body: any) {
        return this.giRegionsService.update(id, body);
    }
}
