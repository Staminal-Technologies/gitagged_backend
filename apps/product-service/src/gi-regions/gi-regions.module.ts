import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GIRegion, GIRegionSchema } from './schema/gi-region.schema';
import { GIRegionsService } from './gi-regions.service';
import { GIRegionsController } from './gi-regions.controller';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: GIRegion.name, schema: GIRegionSchema },
        ]),
    ],
    controllers: [GIRegionsController],
    providers: [GIRegionsService],
    exports: [GIRegionsService],
})
export class GIRegionsModule { }
