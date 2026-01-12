import { Controller, Get, Param, Post, Body, Put,UseGuards, Delete } from '@nestjs/common';
import { GIRegionsService } from './gi-regions.service';
import { AdminJwtGuard } from '../common/guards/admin-jwt.guard';

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
 
      @UseGuards(AdminJwtGuard)
    @Post()
    create(@Body() body: any) {
        return this.giRegionsService.create(body);
    }

    @UseGuards(AdminJwtGuard)
    @Put(':id')
    update(@Param('id') id: string, @Body() body: any) {
        return this.giRegionsService.update(id, body);
    }

    @UseGuards(AdminJwtGuard)
@Delete(':id')
delete(@Param('id') id: string) {
  return this.giRegionsService.delete(id);
}

}
