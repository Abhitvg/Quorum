import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // Cookie parsing for httpOnly JWT cookies
  app.use(cookieParser());

  // Security check for production
  if (process.env.NODE_ENV === 'production') {
    const secret = process.env.JWT_SECRET;
    if (!secret || secret === 'dev-secret-change-me' || secret === 'dev-secret-change-this-in-production') {
      logger.error('CRITICAL: JWT_SECRET is not set or is using a placeholder in production! Crashing.');
      process.exit(1);
    }
  }

  // CORS — support multiple origins via comma-separated env var
  const allowedOrigins = (process.env.CORS_ORIGINS || process.env.FRONTEND_URL || 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim());

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);
  logger.log(`Quorum API running on http://localhost:${port}`);
}
bootstrap();

