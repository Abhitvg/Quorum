import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TranscriptsService } from './transcripts.service';
import { Transcript } from './entities/transcript.entity';
import { MeetingsModule } from '../meetings/meetings.module';
import { LivekitModule } from '../livekit/livekit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Transcript]),
    MeetingsModule,
    LivekitModule,
  ],
  providers: [TranscriptsService],
  exports: [TranscriptsService]
})
export class TranscriptsModule {}
