import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Cookie parsing for httpOnly JWT cookies
  app.use(cookieParser());

  // CORS — allow the Next.js frontend
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true, // Required for cookies
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 Quorum API running on http://localhost:${port}`);
}
bootstrap();
