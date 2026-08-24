import { Module } from '@nestjs/common';
import { InternalController } from './internal.controller';

import { TranscriptsModule } from '../transcripts/transcripts.module';
import { MeetingsModule } from '../meetings/meetings.module';
import { LivekitModule } from '../livekit/livekit.module';

@Module({
  imports: [TranscriptsModule, MeetingsModule, LivekitModule],
  controllers: [InternalController],
})
export class InternalModule {}
