import { Controller, Get, Param, Post, Body, Patch, Put, UseGuards, Delete, UseInterceptors, UploadedFile, Req } from '@nestjs/common';
import { ProductsService } from './products.service';
import { Express } from 'express';
import { memoryStorage } from 'multer';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import cloudinary, { configureCloudinary } from '../common/cloudinary/cloudinary.config'
import { SellerJwtGuard } from '../common/guards/seller-jwt.guard';
import { AdminJwtGuard } from '../common/guards/admin-jwt.guard';

@Controller('products')
export class ProductsController {
  constructor(private readonly service: ProductsService) { }

  @UseGuards(AuthGuard('user-jwt'))
  @Get()
  async getAll(@Req() req: any) {
    return this.service.findAll(req.user);
  }

  @Get('parent-category/:parentId')
  findByParent(@Param('parentId') parentId: string) {
    return this.service.findByParentCategory(parentId);
  }

  @UseGuards(AdminJwtGuard)
  @Get('pending')
  getPendingProducts() {
    return this.service.getPendingProducts();
  }

  @Get(':id/batches')
  async getBatches(@Param('id') id: string) {
    return this.service.getBatchesByProductId(id);
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

  @UseGuards(AuthGuard('user-jwt'))
  @Post()
  async create(@Req() req, @Body() body: any) {
    return this.service.create(body, req.user);
  }

  @UseGuards(AuthGuard('user-jwt'))
  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any, @Req() req) {
    return this.service.update(id, body, req.user);
  }

  @UseGuards(AuthGuard('user-jwt'))
  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req) {
    return this.service.remove(id, req.user);
  }

  @UseGuards(AuthGuard('user-jwt'))
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

  @Patch(':id/reduce-stock')
  reduceStock(
    @Param('id') id: string,
    @Body() body: { quantity: number; variant: string[] },
  ) {
    return this.service.reduceStock(id, body.variant, body.quantity);
  }

  @Patch(':id/restore-stock')
  restoreStock(
    @Param('id') id: string,
    @Body() body: { quantity: number; variant: string[] },
  ) {
    return this.service.restoreStock(id, body.variant, body.quantity);
  }

  @UseGuards(SellerJwtGuard)
  @Get('seller/my-products')
  getMyProducts(@Req() req) {
    console.log("SELLER USER:", req.user);
    return this.service.getSellerProducts(req.user.sub.toString());
  }

  @UseGuards(AdminJwtGuard)
  @Patch(':id/approve')
  approveProduct(@Param('id') id: string) {
    return this.service.approveProduct(id);
  }

  @UseGuards(AdminJwtGuard)
  @Patch(':id/reject')
  rejectProduct(@Param('id') id: string, @Body() body: { reason: string }) {
    return this.service.rejectProduct(id, body.reason);
  }

  @UseGuards(AdminJwtGuard)
  @Patch(':id/approve-update')
  approveUpdate(@Param('id') id: string) {
    return this.service.approveProductUpdate(id);
  }

  @UseGuards(AdminJwtGuard)
  @Patch(':id/reject-update')
  rejectUpdate(@Param('id') id: string, @Body() body: { reason: string }) {
    return this.service.rejectProductUpdate(id, body.reason);
  }

  // @UseGuards(AuthGuard('user-jwt'))
  // @Delete('/remove-selected')
  // removeSelected(
  //   @Req() req,
  //   @Body() body: { keys: string[] }
  // ) {
  //   return this.service.removeSelectedItems(
  //     req.user.sub,
  //     body.keys
  //   );
  // }

  @UseGuards(SellerJwtGuard)
  @Post(':id/add-stock')
  addStock(
    @Param('id') id: string,
    @Body()
    body: {
      variantValues: string[];
      stock: number;
      expiryDate?: Date;
      priceOverride?: number;
      discountPercentageOverride?: number;
    },
    @Req() req,
  ) {
    return this.service.addStock(
      id,
      body,
      req.user.sub,
    );
  }

}
