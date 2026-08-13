import { Module, forwardRef } from '@nestjs/common';
import { LivekitService } from './livekit.service';
import { LivekitController } from './livekit.controller';
import { MeetingsModule } from '../meetings/meetings.module';

@Module({
  imports: [forwardRef(() => MeetingsModule)],
  controllers: [LivekitController],
  providers: [LivekitService],
  exports: [LivekitService],
})
export class LivekitModule {}
