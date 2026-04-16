import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  app.setGlobalPrefix('api');

  app.enableCors({
    origin: 'http://localhost:4200',
    credentials: true,
  });

  const port = process.env['PORT'] ?? 3000;
  await app.listen(port);
}
bootstrap();
