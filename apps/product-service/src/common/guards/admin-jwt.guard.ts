import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../users/schema/users.schema';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class AdminJwtGuard extends AuthGuard('admin-jwt') {

    constructor(
        @InjectModel(User.name)
        private readonly userModel: Model<UserDocument>,
    ) {
        super();
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const canActivate = (await super.canActivate(context)) as boolean;
        if (!canActivate) return false;

        const req = context.switchToHttp().getRequest();
        const payload = req.user;

        const admin = await this.userModel.findById(payload.sub).lean();

        if (!admin || admin.role !== 'admin') {
            throw new UnauthorizedException('Admin access only');
        }

        return true;
    }

}
