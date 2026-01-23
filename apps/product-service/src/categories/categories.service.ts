import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category } from './schema/category.schema';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name)
    private readonly categoryModel: Model<Category>,
  ) { }

  async findAll() {
    return this.categoryModel.find().lean();
  }

  async getMenu() {
    // get all parent categories (parentId = null)
    const parents = await this.categoryModel.find({ parentId: null }).lean();

    // for each parent, fetch children
    const menu = await Promise.all(parents.map(async (p) => {
      const children = await this.categoryModel.find({ parentId: p._id }).lean();
      return {
        _id: p._id,
        name: p.name,
        image: p.image,  // Optional, if you have image
        children: children.map(c => ({
          _id: c._id,
          name: c.name,
          image: c.image, // if exists
        })),
      };
    }));

    return menu;
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
