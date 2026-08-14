import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Signer } from '@aws-sdk/rds-signer';

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
        const iamAuth = config.get<boolean>('database.iamAuth');
        const dbHost = config.get<string>('database.host') as string;
        const dbPort = config.get<number>('database.port');
        const dbUser = config.get<string>('database.user') as string;
        const dbRegion = config.get<string>('database.region');

        console.log('--- DATABASE CONNECTION DEBUG ---');
        console.log('DATABASE_URL present:', !!dbUrl);
        console.log('DATABASE_IAM_AUTH:', iamAuth);
        console.log('DATABASE_HOST:', dbHost);
        console.log('DATABASE_PORT:', dbPort);
        console.log('---------------------------------');

        return {
          type: 'postgres' as const,
          ...(dbUrl && !iamAuth
            ? {
                url: dbUrl,
                ssl: { rejectUnauthorized: false }, // Common for managed DBs like Render/Supabase
              }
            : {
                host: dbHost,
                port: dbPort,
                database: config.get<string>('database.name') as string,
                username: dbUser,
                password: iamAuth
                  ? async () => {
                      const signer = new Signer({
                        hostname: dbHost,
                        port: dbPort as number,
                        username: dbUser,
                        region: dbRegion,
                      });
                      return await signer.getAuthToken();
                    }
                  : (config.get<string>('database.password') as string),
                ...(iamAuth ? { ssl: { rejectUnauthorized: false } } : {}),
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
