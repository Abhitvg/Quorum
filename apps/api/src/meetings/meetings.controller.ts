import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { IsString, MinLength, IsBoolean, IsOptional } from 'class-validator';
import { Request } from 'express';
import { MeetingsService } from './meetings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';

class CreateMeetingDto {
  @IsString()
  @MinLength(1)
  title: string;
}

class MuteParticipantDto {
  @IsString()
  trackSid: string;

  @IsBoolean()
  muted: boolean;
}

@Controller('meetings')
@UseGuards(JwtAuthGuard)
export class MeetingsController {
  constructor(private readonly meetingsService: MeetingsService) {}

  @Post()
  async create(
    @Body() dto: CreateMeetingDto,
    @Req() req: Request & { user: User },
  ) {
    const meeting = await this.meetingsService.create(dto.title, req.user);
    return { meeting };
  }

  @Get()
  async list(@Req() req: Request & { user: User }) {
    const meetings = await this.meetingsService.listByOrg(req.user.orgId);
    return { meetings };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const meeting = await this.meetingsService.findById(id);
    return { meeting };
  }

  @Post(':id/summon-agent')
  async summonAgent(@Param('id') id: string) {
    const meeting = await this.meetingsService.findById(id);
    const agentName = process.env.AGENT_IDENTITY || 'quo-agent';
    // Access the livekitService via meetingsService or directly if we inject it
    // Wait, meetingsService already has livekitService. We can add a method to meetingsService.
    await this.meetingsService.summonAgent(meeting.id);
    return { success: true };
  }

  @Post(':id/token')
  async getToken(
    @Param('id') id: string,
    @Req() req: Request & { user: User },
  ) {
    return this.meetingsService.generateJoinToken(id, req.user);
  }

  @Post(':id/end')
  @HttpCode(HttpStatus.OK)
  async end(
    @Param('id') id: string,
    @Req() req: Request & { user: User },
  ) {
    const meeting = await this.meetingsService.endMeeting(id, req.user);
    return { meeting };
  }

  // =============================================
  // Host Controls (Phase 3)
  // =============================================

  /**
   * List participants currently in the LiveKit room.
   */
  @Get(':id/participants')
  async getParticipants(@Param('id') id: string) {
    const participants = await this.meetingsService.getParticipants(id);
    return { participants };
  }

  /**
   * Mute/unmute a participant's track (host only).
   */
  @Post(':id/participants/:identity/mute')
  @HttpCode(HttpStatus.OK)
  async muteParticipant(
    @Param('id') id: string,
    @Param('identity') identity: string,
    @Body() dto: MuteParticipantDto,
    @Req() req: Request & { user: User },
  ) {
    const result = await this.meetingsService.muteParticipant(
      id,
      identity,
      dto.trackSid,
      dto.muted,
      req.user,
    );
    return { track: result };
  }

  /**
   * Kick a participant from the room (host only).
   */
  @Delete(':id/participants/:identity')
  @HttpCode(HttpStatus.NO_CONTENT)
  async kickParticipant(
    @Param('id') id: string,
    @Param('identity') identity: string,
    @Req() req: Request & { user: User },
  ) {
    await this.meetingsService.kickParticipant(id, identity, req.user);
  }

  // =============================================
  // Recording Controls (Phase 4)
  // =============================================

  @Post(':id/recording/start')
  @HttpCode(HttpStatus.OK)
  async startRecording(
    @Param('id') id: string,
    @Req() req: Request & { user: User },
  ) {
    const recording = await this.meetingsService.startRecording(id, req.user);
    return { recording };
  }

  @Post(':id/recording/stop')
  @HttpCode(HttpStatus.OK)
  async stopRecording(
    @Param('id') id: string,
    @Body('egressId') egressId: string,
    @Req() req: Request & { user: User },
  ) {
    const recording = await this.meetingsService.stopRecording(id, egressId, req.user);
    return { recording };
  }

  @Get(':id/recordings')
  async getRecordings(
    @Param('id') id: string,
    @Req() req: Request & { user: User },
  ) {
    const recordings = await this.meetingsService.getRecordings(id, req.user);
    return { recordings };
  }
}
