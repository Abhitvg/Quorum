import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Meeting } from './entities/meeting.entity';
import { Participant } from './entities/participant.entity';
import { MeetingsService } from './meetings.service';
import { MeetingsController } from './meetings.controller';
import { Recording } from './entities/recording.entity';
import { LivekitModule } from '../livekit/livekit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Meeting, Participant, Recording]),
    LivekitModule,
  ],
  providers: [MeetingsService],
  controllers: [MeetingsController],
  exports: [MeetingsService],
})
export class MeetingsModule {}
