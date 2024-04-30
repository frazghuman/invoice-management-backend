import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as express from 'express';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

const dotenv = require('dotenv');

async function bootstrap() {
  dotenv.config();
  const config = {
    mongoUri: process.env.MONGO_URI,
    port: process.env.PORT,
  };
  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn', 'log', 'debug', 'verbose'] });
  app.useGlobalFilters(new AllExceptionsFilter());
  app.enableCors({
    origin: true,
  });

  // Increase the payload size limit (e.g., to 100MB)
  app.use(express.json({ limit: '100mb' }));

  await app.listen(config.port);

  
}
bootstrap();
