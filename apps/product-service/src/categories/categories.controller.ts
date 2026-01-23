import { Controller, Get, UseGuards, Put, Post, Body, Param, Delete, UseInterceptors } from '@nestjs/common';
import { UploadedFile } from '@nestjs/common/decorators';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Express } from 'express';
import cloudinary, { configureCloudinary } from '../common/cloudinary/cloudinary.config';
import { CategoriesService } from './categories.service';
import { AdminJwtGuard } from '../common/guards/admin-jwt.guard';
@Controller('categories')
export class CategoriesController {

  constructor(private readonly service: CategoriesService) { }

  @Get()
  getAll() {
    return this.service.findAll();
  }

  @Get('menu')
  async getMenu() {
    return this.service.getMenu();
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

  @UseGuards(AdminJwtGuard)
  @Post('upload-image')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  async uploadCategoryImage(@UploadedFile() file: Express.Multer.File) {

    configureCloudinary();

    if (!file) {
      throw new Error('No file received');
    }

    const result: any = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: 'categories' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        },
      ).end(file.buffer);
    });

    return { url: result.secure_url };
  }

}
