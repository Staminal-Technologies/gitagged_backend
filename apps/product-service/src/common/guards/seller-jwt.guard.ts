import { AuthGuard } from '@nestjs/passport';

export class SellerJwtGuard extends AuthGuard('seller-jwt') {}