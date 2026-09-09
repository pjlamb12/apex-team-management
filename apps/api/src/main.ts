import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  app.setGlobalPrefix('api');

  const corsOriginsEnv = process.env['CORS_ORIGINS'];
  const allowedOrigins: (string | RegExp)[] | boolean =
    corsOriginsEnv === '*'
      ? true
      : [
          'http://localhost:8200',
          'http://localhost:4200',
          'http://localhost:3000',
          'http://localhost',
          'https://localhost',
          'capacitor://localhost',
          'https://apex.prestonlamb.us',
          ...(corsOriginsEnv
            ? corsOriginsEnv
                .split(',')
                .map((o) => o.trim())
                .filter(Boolean)
            : []),
        ];

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  const port = process.env['PORT'] ?? 3000;
  await app.listen(port);
}
bootstrap();
