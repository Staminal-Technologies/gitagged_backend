import { Controller, Get } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { UseGuards } from '@nestjs/common';
import { AdminJwtAuthGuard } from '../common/guards/admin-jwt.guard';

@UseGuards(AdminJwtAuthGuard)
@Controller('categories')
export class CategoriesController {
    constructor(private readonly categoriesService: CategoriesService) { }

    @Get()
    getAll() {
        return this.categoriesService.findAll();
    }

    @Get('tree')
    getTree() {
        return this.categoriesService.findTree();
    }
}
