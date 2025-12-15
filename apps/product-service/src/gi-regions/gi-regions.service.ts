import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GIRegion } from './schema/gi-region.schema';

@Injectable()
export class GIRegionsService {
    constructor(
        @InjectModel(GIRegion.name)
        private giRegionModel: Model<GIRegion>,
    ) { }

    async findAll() {
        return this.giRegionModel.find().lean();
    }

    async findById(id: string) {
        return this.giRegionModel.findById(id).lean();
    }

    async create(data: any) {
        return this.giRegionModel.create(data);
    }

    async update(id: string, data: any) {
        return this.giRegionModel.findByIdAndUpdate(id, data, { new: true });
    }
}
