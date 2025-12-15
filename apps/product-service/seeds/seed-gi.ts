import mongoose from 'mongoose';
import { readFileSync } from 'fs';
import { join } from 'path';
import { GIRegionSchema } from '../src/gi-regions/schema/gi-region.schema';

async function seedGIRegions() {
    try {
        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/gi-product-db';
        console.log('Connecting to MongoDB:', mongoUri);

        await mongoose.connect(mongoUri);
        console.log('Connected.');

        const jsonPath = join(__dirname, 'gi-regions.json');
        const rawData = readFileSync(jsonPath, 'utf8');
        const giRegions = JSON.parse(rawData);

        const GIRegionModel = mongoose.model('GIRegion', GIRegionSchema);

        console.log(`Seeding ${giRegions.length} GI regions...`);

        for (const region of giRegions) {
            await GIRegionModel.findOneAndUpdate(
                { _id: region.id },
                {
                    name: region.name,
                    description: region.description,
                    state: region.state,
                    certificateNumber: region.certificateNumber,
                    imageUrl: region.imageUrl,
                    categories: region.categories,
                },
                { upsert: true }
            );
        }

        console.log('GI Region seeding completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('GI seeding failed:', error);
        process.exit(1);
    }
}

seedGIRegions();
