import { Module, OnModuleInit } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { seedAdmin } from './admin.seed';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Admin, AdminSchema } from './schema/admin.schema';
import { AdminAuthService } from './admin-auth.service';
import { AdminAuthController } from './admin-auth.controller';
import { AdminJwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    ConfigModule, // ✅ REQUIRED

    MongooseModule.forFeature([
      { name: Admin.name, schema: AdminSchema },
    ]),

    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('ADMIN_JWT_SECRET'),
        signOptions: { expiresIn: '7d' },
      }),
    }),
  ],
  controllers: [AdminAuthController],
  providers: [AdminAuthService, AdminJwtStrategy],
})
export class AdminAuthModule implements OnModuleInit {
  constructor(
    @InjectModel(Admin.name) private adminModel: Model<Admin>,
  ) { }

  async onModuleInit() {
    await seedAdmin(this.adminModel);
  }
}
