import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { Admin } from './schema/admin.schema';

export async function seedAdmin(adminModel: Model<Admin>) {
  const hashedPassword = await bcrypt.hash('admin123', 10);

  await adminModel.updateOne(
    { email: 'admin@gitagged.com' },
    {
      $set: {
        password: hashedPassword,
      },
    },
    { upsert: true },
  );

  console.log('✅ Admin user seeded/updated successfully.');
}

