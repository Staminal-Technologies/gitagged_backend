import { Controller, Post, Get, Patch, Param, Body, Req, UseGuards } from '@nestjs/common';
import { SellerService } from './seller.service';
import { UserJwtGuard } from '../common/guards/user-jwt.guards';
import { AdminJwtGuard } from '../common/guards/admin-jwt.guards';
import { SellerJwtGuard } from '../common/guards/seller-jwt.guards';
import { UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import cloudinary, {
  configureCloudinary,
} from 'apps/product-service/src/common/cloudinary/cloudinary.config';
import { Express } from 'express';

@Controller('sellers')
export class SellerController {
  constructor(private readonly sellerService: SellerService) { }

  // USER APPLY
  @UseGuards(UserJwtGuard)
  @Post('apply')
  applySeller(@Req() req, @Body() body: any) {
    return this.sellerService.applySeller(req.user.sub, body);
  }

  // USER UPLOAD DIGITAL SIGNATURE
  @UseGuards(UserJwtGuard)
  @Post('upload-signature')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
    }),
  )
  async uploadSignature(
    @UploadedFile() file: Express.Multer.File,
  ) {
    configureCloudinary();

    if (!file) {
      throw new Error('No file received');
    }

    const result: any = await new Promise(
      (resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              folder: 'seller-signatures',
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            },
          )
          .end(file.buffer);
      },
    );

    return {
      url: result.secure_url,
    };
  }

  // USER VIEW OWN SELLER PROFILE
  @UseGuards(SellerJwtGuard)
  @Get('me')
  getMySeller(@Req() req) {
    return this.sellerService.getMySellerProfile(req.user.sub);
  }

  // ADMIN VIEW ALL SELLERS
  @UseGuards(AdminJwtGuard)
  @Get()
  getAll() {
    return this.sellerService.getAllSellers();
  }

  // ADMIN APPROVE
  @UseGuards(AdminJwtGuard)
  @Patch(':id/approve')
  approve(@Param('id') id: string) {
    // return this.sellerService.approveSeller(id);
    return this.sellerService.updateSellerStatus(id, 'APPROVED');
  }

  // ADMIN REJECT
  @UseGuards(AdminJwtGuard)
  @Patch(':id/reject')
  reject(@Param('id') id: string, @Body() body: { reason: string }) {
    return this.sellerService.updateSellerStatus(id, 'REJECTED', body.reason);
  }

  @UseGuards(AdminJwtGuard)
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string }
  ) {
    return this.sellerService.updateSellerStatus(id, body.status);
  }

  @UseGuards(SellerJwtGuard)
  @Patch('update-profile')
  updateProfile(
    @Req() req,
    @Body() body: any
  ) {
    return this.sellerService.updateSellerProfile(
      req.user.sub,
      body
    );
  }

  @UseGuards(AdminJwtGuard)
  @Patch(':id/approve-profile-update')
  approveProfileUpdate(
    @Param('id') id: string
  ) {
    return this.sellerService.approveProfileUpdate(id);
  }

  @UseGuards(AdminJwtGuard)
  @Patch(':id/reject-profile-update')
  rejectProfileUpdate(
    @Param('id') id: string,
    @Body() body: { reason: string }
  ) {
    return this.sellerService.rejectProfileUpdate(
      id,
      body.reason
    );
  }

  @UseGuards(AdminJwtGuard)
  @Patch(':id/block')
  blockSeller(@Param('id') id: string) {
    return this.sellerService.blockSeller(id);
  }

  @UseGuards(AdminJwtGuard)
  @Patch(':id/unblock')
  unblockSeller(@Param('id') id: string) {
    return this.sellerService.unblockSeller(id);
  }

  @UseGuards(UserJwtGuard)
  @Get('my-application')
  getMyApplication(@Req() req) {
    return this.sellerService.getSellerByUserId(
      req.user.sub,
    );
  }
}