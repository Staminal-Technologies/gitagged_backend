import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category } from './schema/category.schema';

@Injectable()
export class CategoriesService {
    constructor(
        @InjectModel(Category.name) private categoryModel: Model<Category>,
    ) { }

  findAll() {
    return this.categoryModel.find().lean();
  }

  create(data: Partial<Category>) {
    return this.categoryModel.create(data);
  }

  update(id: string, data: Partial<Category>) {
    return this.categoryModel.findByIdAndUpdate(id, data, { new: true });
  }

  delete(id: string) {
    return this.categoryModel.findByIdAndDelete(id);
  }

}
