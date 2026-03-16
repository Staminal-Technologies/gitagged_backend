import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

   app.enableCors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  const port = process.env.ORDER_SERVICE_PORT || 3003;
  await app.listen(port); // 👈 Order service port
  console.log('Order service running on port 3003');
  console.log('JWT_SECRET loaded:', process.env.JWT_SECRET);
}
bootstrap();
