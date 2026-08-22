import { Module, Logger } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Signer } from '@aws-sdk/rds-signer';

const logger = new Logger('DatabaseModule');

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

        if (process.env.NODE_ENV !== 'production') {
          logger.log(`Connecting to ${iamAuth ? 'IAM-auth' : 'password-auth'} database at ${dbHost}:${dbPort}`);
        }

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
          synchronize: process.env.NODE_ENV !== 'production',
          logging: process.env.NODE_ENV === 'development',
        };
      },
    }),
  ],
})
export class DatabaseModule {}
