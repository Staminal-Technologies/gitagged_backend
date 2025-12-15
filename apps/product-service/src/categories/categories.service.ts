import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category } from './schema/category.schema';

@Injectable()
export class CategoriesService {
    constructor(
        @InjectModel(Category.name) private categoryModel: Model<Category>,
    ) { }

    async findAll() {
        return this.categoryModel.find().lean();
    }

    async findTree() {
        const categories = await this.categoryModel.find().lean();

        const map = new Map(categories.map(c => [c._id.toString(), { ...c, childrenNodes: [] }]));
        const roots = [];

        for (const category of map.values()) {
            if (category.parentId) {
                const parent = map.get(category.parentId);
                if (parent) {
                    parent.childrenNodes.push(category);
                }
            } else {
                roots.push(category);
            }
        }

        return roots;
    }
}
