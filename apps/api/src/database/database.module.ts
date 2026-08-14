import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        if (process.env.NODE_ENV === 'test') {
          return {
            type: 'sqlite',
            database: ':memory:',
            autoLoadEntities: true,
            synchronize: true,
            logging: false,
          };
        }
        const dbUrl = config.get<string>('database.url');
        return {
          type: 'postgres' as const,
          ...(dbUrl
            ? {
                url: dbUrl,
                ssl: { rejectUnauthorized: false }, // Common for managed DBs like Render/Supabase
              }
            : {
                host: config.get<string>('database.host') as string,
                port: config.get<number>('database.port'),
                database: config.get<string>('database.name') as string,
                username: config.get<string>('database.user') as string,
                password: config.get<string>('database.password') as string,
              }),
          autoLoadEntities: true,
          synchronize: true, // DEV ONLY — use migrations in production
          logging: process.env.NODE_ENV === 'development',
        };
      },
    }),
  ],
})
export class DatabaseModule {}
