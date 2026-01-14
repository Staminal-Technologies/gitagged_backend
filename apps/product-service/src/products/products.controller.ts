import { Controller, Get, Param, Post, Body, Put, UseGuards, Delete, UseInterceptors, UploadedFile, } from '@nestjs/common';
import { ProductsService } from './products.service';
import { Express } from 'express';
import { memoryStorage } from 'multer';
import { AdminJwtGuard } from '../common/guards/admin-jwt.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import cloudinary, {configureCloudinary}from '../common/cloudinary/cloudinary.config'

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

    @UseGuards(AdminJwtGuard)
@Post('upload-image')
@UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
async uploadImage(@UploadedFile() file: Express.Multer.File) {

  configureCloudinary();

  if (!file) {
    throw new Error('No file received');
  }

  const result: any = await new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder: 'products' },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      },
    ).end(file.buffer);
  });

  return {
    url: result.secure_url,
  };
}

}
