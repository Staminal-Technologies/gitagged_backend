import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { User, UserDocument } from '../../users/schema/users.schema';
import {InjectModel} from '@nestjs/mongoose';
import {Model} from 'mongoose';

@Injectable()
export class UserJwtGuard extends AuthGuard('user-jwt') {

    constructor(
        @InjectModel(User.name)
        private readonly userModel: Model<UserDocument>,
    ) {
        super();
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        // ✅ First let passport validate JWT
        const canActivate = (await super.canActivate(context)) as boolean;
        if (!canActivate) return false;

        const req = context.switchToHttp().getRequest();
        const payload = req.user; // injected by passport strategy

        const user = await this.userModel.findById(payload.sub).lean();

        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        if (user.isBlocked) {
            throw new UnauthorizedException('User blocked by admin');
        }

        if (user.isActive === false) {
            throw new UnauthorizedException('User account inactive');
        }

        return true;
    }

}
