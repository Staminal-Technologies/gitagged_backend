import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GIRegion, GIRegionSchema } from './schema/gi-region.schema';
import { GiRegionsService } from './gi-regions.service';
import { GIRegionsController } from './gi-regions.controller';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: GIRegion.name, schema: GIRegionSchema },
        ]),
    ],
    controllers: [GIRegionsController],
    providers: [GiRegionsService],
    exports: [GiRegionsService],
})
export class GIRegionsModule { }
