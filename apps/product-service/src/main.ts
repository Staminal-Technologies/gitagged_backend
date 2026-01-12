import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
   app.enableCors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  const port = process.env.PORT || 3002;
  await app.listen(port);

  console.log(`🚀 Product service running on port ${port}`);

  // Simple connection test
  const mongoose = app.get('DatabaseConnection');
  if (mongoose?.readyState === 1) {
    console.log('🟢 MongoDB connected successfully.');
  } else {
    console.log('🔴 MongoDB connection failed.');
  }
}
bootstrap();
