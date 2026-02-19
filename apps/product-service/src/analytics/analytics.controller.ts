import { Controller, Get, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AdminJwtGuard } from '../common/guards/admin-jwt.guard';

@Controller('admin/analytics')
@UseGuards(AdminJwtGuard)
export class AnalyticsController {
    constructor(private readonly analyticsService: AnalyticsService) { }

    @Get('summary')
    getSummary() {
        return this.analyticsService.getSummary();
    }

    @Get('products')
    getProductAnalytics() {
        return this.analyticsService.getProductAnalytics();
    }

    @Get('users')
    getUserAnalytics() {
        return this.analyticsService.getUserAnalytics();
    }
}
