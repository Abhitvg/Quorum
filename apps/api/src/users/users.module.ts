import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { OrgsModule } from '../orgs/orgs.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), OrgsModule],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
