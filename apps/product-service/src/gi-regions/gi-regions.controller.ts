import { Controller, Get, Param, Post, Body, Put, UseGuards, Delete ,UseInterceptors, UploadedFile} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import cloudinary,{configureCloudinary} from '../common/cloudinary/cloudinary.config';
import {Express} from 'express';
import { GiRegionsService } from './gi-regions.service';
import { AdminJwtGuard } from '../common/guards/admin-jwt.guard';

@Controller('gi-regions')
export class GIRegionsController {
    constructor(private readonly giRegionsService: GiRegionsService) { }

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

    // ✅ IMAGE UPLOAD
  @UseGuards(AdminJwtGuard)
  @Post('upload-image')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  async uploadRegionImage(@UploadedFile() file: Express.Multer.File) {
    configureCloudinary();

    if (!file) throw new Error('No file received');

    const result: any = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: 'gi-regions' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        },
      ).end(file.buffer);
    });

    return { url: result.secure_url };
  }

}
