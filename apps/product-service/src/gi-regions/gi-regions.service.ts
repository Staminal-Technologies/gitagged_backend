import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GIRegion } from './schema/gi-region.schema';

@Injectable()
export class GiRegionsService {
  constructor(
    @InjectModel(GIRegion.name)
    private readonly regionModel: Model<GIRegion>,
  ) { }

  async findAll() {
    return this.regionModel.find().lean();
  }

  async findById(id: string) {
    return this.regionModel.findById(id).lean();
  }

  async create(data: Partial<GIRegion>) {
    return this.regionModel.create(data);
  }

  async update(id: string, data: Partial<GIRegion>) {
    return this.regionModel
      .findByIdAndUpdate(id, data, { new: true })
      .lean();
  }

  async delete(id: string) {
    return this.regionModel.findByIdAndDelete(id);
  }

  async updateImage(id: string, imageUrl: string) {
  return this.regionModel.findByIdAndUpdate(
    id,
    { image: imageUrl },
    { new: true }
  );
}

}
