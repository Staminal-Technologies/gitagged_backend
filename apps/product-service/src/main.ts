import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';

dotenv.config();
async function bootstrap() {

  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  const port = process.env.PRODUCT_SERVICE_PORT || 3002;
  await app.listen(port);

  console.log(`🚀 Product service running on port ${port}`);
  console.log('JWT_SECRET loaded:', process.env.JWT_SECRET);

  // Simple connection test
  const mongoose = app.get('DatabaseConnection');
  if (mongoose?.readyState === 1) {
    console.log('🟢 MongoDB connected successfully.');
  } else {
    console.log('🔴 MongoDB connection failed.');
  }
}
bootstrap();
