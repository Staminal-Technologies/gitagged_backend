import mongoose from 'mongoose';
import { readFileSync } from 'fs';
import { join } from 'path';
import { CategorySchema } from '../src/categories/schema/category.schema';

async function seed() {
    try {
        // MONGO CONNECTION
        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/gi-product-db';
        console.log('Connecting to MongoDB:', mongoUri);

        await mongoose.connect(mongoUri);
        console.log('Connected.');

        // READ JSON DATA
        const jsonPath = join(__dirname, 'categories.json');
        const rawData = readFileSync(jsonPath, 'utf8');
        const categories = JSON.parse(rawData);

        // CATEGORY MODEL
        const CategoryModel = mongoose.model('Category', CategorySchema);

        console.log(`Seeding ${categories.length} categories...`);

        for (const cat of categories) {
            await CategoryModel.findOneAndUpdate(
                { _id: cat.id },   // use slug as the _id
                {
                    name: cat.name,
                    description: cat.description || '',
                    imageUrl: cat.imageUrl || '',
                    parentId: cat.parentId,
                    children: cat.children,
                },
                { upsert: true, new: true }
            );
        }

        console.log('Category seeding completed successfully.');
        process.exit(0);

    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
}

seed();
