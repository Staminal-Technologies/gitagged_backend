import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category } from './schema/category.schema';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name)
    private readonly categoryModel: Model<Category>,
  ) {}

  async findAll() {
    return this.categoryModel.find().lean();
  }

  async findById(id: string) {
    return this.categoryModel.findById(id).lean();
  }

  async create(data: Partial<Category>) {
    return this.categoryModel.create(data);
  }

  async update(id: string, data: Partial<Category>) {
    return this.categoryModel
      .findByIdAndUpdate(id, data, { new: true })
      .lean();
  }

  async delete(id: string) {
    return this.categoryModel.findByIdAndDelete(id);
  }
}
