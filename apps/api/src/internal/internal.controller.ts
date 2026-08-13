import { Controller, Post, Body, UseGuards, HttpCode, HttpStatus, NotFoundException } from '@nestjs/common';
import { InternalAuthGuard } from './guards/internal-auth.guard';
import { TranscriptsService } from '../transcripts/transcripts.service';
import { MeetingsService } from '../meetings/meetings.service';
import { LivekitService } from '../livekit/livekit.service';

class CreateTranscriptDto {
  roomName: string;
  speakerIdentity: string;
  speakerName: string;
  text: string;
  isFinal: boolean;
}

@Controller('internal')
@UseGuards(InternalAuthGuard)
export class InternalController {
  constructor(
    private readonly transcriptsService: TranscriptsService,
    private readonly meetingsService: MeetingsService,
    private readonly livekitService: LivekitService,
  ) {}

  @Post('transcripts')
  @HttpCode(HttpStatus.OK)
  async ingestTranscript(@Body() dto: CreateTranscriptDto) {
    // 1. Validate meeting exists
    let meeting;
    try {
      meeting = await this.meetingsService.findByRoomName(dto.roomName);
    } catch (e) {
      throw new NotFoundException('Meeting not found');
    }

    // 2. Save transcript (if final)
    if (dto.isFinal) {
      await this.transcriptsService.saveTranscript({
        meetingId: meeting.id,
        speakerIdentity: dto.speakerIdentity,
        speakerName: dto.speakerName,
        text: dto.text,
        isFinal: dto.isFinal,
      });
    }

    // 3. Broadcast to clients via LiveKit Data Channel
    const payload = {
      type: 'transcript',
      data: {
        speakerIdentity: dto.speakerIdentity,
        speakerName: dto.speakerName,
        text: dto.text,
        isFinal: dto.isFinal,
        timestamp: Date.now(),
      }
    };
    
    await this.livekitService.broadcastData(meeting.roomName, payload, 'transcript');

    return { success: true };
  }
}
