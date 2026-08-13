import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LivekitService } from './livekit.service';

@Module({
  providers: [LivekitService],
  exports: [LivekitService],
})
export class LivekitModule {}
