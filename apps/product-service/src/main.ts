import { NestFactory } from '@nestjs/core';
import { ProductServiceModule } from './product-service.module';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(ProductServiceModule);
  await app.listen(process.env.port ?? 3002);
}
bootstrap();
