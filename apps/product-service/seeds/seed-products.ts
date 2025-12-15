import mongoose from 'mongoose';
import { readFileSync } from 'fs';
import { join } from 'path';
import { ProductSchema } from '../src/products/schema/product.schema';

async function seedProducts() {
    try {
        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/gi-product-db';
        console.log('Connecting to MongoDB:', mongoUri);

        await mongoose.connect(mongoUri);
        console.log('Connected.');

        const jsonPath = join(__dirname, 'products.json');
        const rawData = readFileSync(jsonPath, 'utf8');
        const products = JSON.parse(rawData);

        const ProductModel = mongoose.model('Product', ProductSchema);

        console.log(`Seeding ${products.length} products...`);

        for (const product of products) {
            await ProductModel.findOneAndUpdate(
                { _id: product.id },
                product,
                { upsert: true }
            );
        }

        console.log('Product seeding completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Product seeding failed:', error);
        process.exit(1);
    }
}

seedProducts();
