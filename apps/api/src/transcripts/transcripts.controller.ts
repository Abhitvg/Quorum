import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Req,
  UseGuards,
  ForbiddenException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { TranscriptsService } from './transcripts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';
import { MeetingsService } from '../meetings/meetings.service';
import { IsString, IsBoolean, IsNumber, IsOptional } from 'class-validator';

class CreateTranscriptDto {
  @IsString()
  meetingId: string;

  @IsString()
  speakerIdentity: string;

  @IsOptional()
  @IsString()
  speakerName?: string;

  @IsString()
  text: string;

  @IsBoolean()
  isFinal: boolean;

  @IsNumber()
  startMs: number;

  @IsNumber()
  endMs: number;

  @IsNumber()
  confidence: number;
}

@Controller('transcripts')
@UseGuards(JwtAuthGuard)
export class TranscriptsController {
  constructor(
    private readonly transcriptsService: TranscriptsService,
    private readonly meetingsService: MeetingsService,
  ) {}

  @Get('meeting/:meetingId')
  async getMeetingTranscripts(
    @Param('meetingId') meetingId: string,
    @Req() req: Request & { user: User },
  ) {
    const meeting = await this.meetingsService.findById(meetingId);
    if (meeting.orgId !== req.user.orgId) {
      throw new ForbiddenException('Cannot access transcripts for this meeting');
    }

    const transcripts = await this.transcriptsService.getTranscripts(meetingId);
    return { transcripts };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async saveTranscript(
    @Body() dto: CreateTranscriptDto,
    @Req() req: Request & { user: User },
  ) {
    // Ideally verify that the user/agent is authorized to push transcripts to this meeting
    const meeting = await this.meetingsService.findById(dto.meetingId);
    if (meeting.orgId !== req.user.orgId) {
      throw new ForbiddenException('Cannot add transcripts for this meeting');
    }

    const transcript = await this.transcriptsService.saveTranscript(dto);
    return { transcript };
  }
}
