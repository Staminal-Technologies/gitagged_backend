import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { Admin } from './schema/admin.schema';

export async function seedAdmin(adminModel: Model<Admin>) {
  const hashedPassword = await bcrypt.hash('Dhamu@admin', 10);

  await adminModel.updateOne(
    { email: 'dhamu@gitagged.com' },
    {
      $set: {
        password: hashedPassword,
      },
    },
    { upsert: true },
  );

  console.log('✅ Admin seeded/updated successfully.');
}

