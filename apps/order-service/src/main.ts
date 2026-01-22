import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();

  await app.listen(3003); // 👈 Order service port
  console.log('Order service running on port 3003');
}
bootstrap();
