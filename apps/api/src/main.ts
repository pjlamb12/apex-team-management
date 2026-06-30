import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  app.setGlobalPrefix('api');

  const isProd = process.env['NODE_ENV'] === 'production';
  app.enableCors({
    origin: (origin, callback) => {
      if (
        !origin ||
        !isProd ||
        origin.startsWith('http://localhost') ||
        origin.startsWith('http://127.0.0.1') ||
        origin.match(/^http:\/\/192\.168\.\d+\.\d+/) ||
        origin.match(/^http:\/\/10\.\d+\.\d+\.\d+/) ||
        origin.match(/^http:\/\/172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+/) ||
        origin.endsWith('.local') ||
        origin.match(/\.local:\d+$/) ||
        origin === 'https://apex.prestonlamb.us'
      ) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  });

  const port = process.env['PORT'] ?? 3000;
  await app.listen(port);
}
bootstrap();
