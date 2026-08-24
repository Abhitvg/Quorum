import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Meeting } from './entities/meeting.entity';
import { Participant } from './entities/participant.entity';
import { Recording } from './entities/recording.entity';
import { LivekitService } from '../livekit/livekit.service';
import { User } from '../users/entities/user.entity';

@Injectable()
export class MeetingsService {
  private readonly logger = new Logger(MeetingsService.name);

  constructor(
    @InjectRepository(Meeting)
    private readonly meetingRepo: Repository<Meeting>,
    @InjectRepository(Participant)
    private readonly participantRepo: Repository<Participant>,
    @InjectRepository(Recording)
    private readonly recordingRepo: Repository<Recording>,
    private readonly livekitService: LivekitService,
  ) {}

  /**
   * Create a new meeting. Generates a unique LiveKit room name.
   */
  async create(title: string, user: User): Promise<Meeting> {
    const roomName = `qr-${uuidv4().slice(0, 8)}`;

    const meeting = this.meetingRepo.create({
      title,
      hostId: user.id,
      orgId: user.orgId,
      roomName,
      status: 'scheduled',
    });

    return this.meetingRepo.save(meeting);
  }

  /**
   * Get meeting by ID. Throws if not found.
   */
  async findById(id: string): Promise<Meeting> {
    const meeting = await this.meetingRepo.findOne({
      where: { id },
      relations: ['host'],
    });
    if (!meeting) {
      throw new NotFoundException('Meeting not found');
    }
    return meeting;
  }

  /**
   * Get meeting by ID with org-scoping. Throws if not found or not in user's org.
   */
  async findByIdForUser(id: string, user: User): Promise<Meeting> {
    const meeting = await this.findById(id).catch(() => null);
    if (!meeting || meeting.orgId !== user.orgId) {
      throw new ForbiddenException('Meeting not found');
    }
    return meeting;
  }

  /**
   * Get meeting by roomName. Throws if not found.
   */
  async findByRoomName(roomName: string): Promise<Meeting> {
    const meeting = await this.meetingRepo.findOne({
      where: { roomName },
      relations: ['host'],
    });
    if (!meeting) {
      throw new NotFoundException('Meeting not found');
    }
    return meeting;
  }

  /**
   * List meetings for a user's org.
   */
  async listByOrg(orgId: string): Promise<Meeting[]> {
    return this.meetingRepo.find({
      where: { orgId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  /**
   * Generate a LiveKit token for a user to join a meeting.
   * Also records them as a participant.
   */
  async generateJoinToken(
    meetingId: string,
    user: User,
  ): Promise<{ token: string; url: string }> {
    const meeting = await this.findByIdForUser(meetingId, user);

    if (meeting.status === 'scheduled') {
      meeting.status = 'live';
      meeting.startedAt = new Date();
      await this.meetingRepo.save(meeting);

      // Dispatch the Quo agent to join the room
      this.summonAgent(meeting.id, user).catch(e => {
        this.logger.error('Failed to dispatch agent automatically:', e);
      });
    }

    // Record participant join (upsert to prevent duplicates)
    const existing = await this.participantRepo.findOne({
      where: { meetingId: meeting.id, userId: user.id },
    });
    if (!existing) {
      const participant = this.participantRepo.create({
        meetingId: meeting.id,
        userId: user.id,
      });
      await this.participantRepo.save(participant);
    }

    // Generate LiveKit token
    const token = await this.livekitService.generateToken(
      meeting.roomName,
      user.id,
      user.name,
    );

    return {
      token,
      url: this.livekitService.getServerUrl(),
    };
  }

  /**
   * End a meeting (host only).
   */
  async endMeeting(meetingId: string, user: User): Promise<Meeting> {
    const meeting = await this.findById(meetingId);
    if (meeting.hostId !== user.id) {
      throw new ForbiddenException('Only the host can end the meeting');
    }

    meeting.status = 'ended';
    meeting.endedAt = new Date();
    return this.meetingRepo.save(meeting);
  }

  async summonAgent(meetingId: string, user: User) {
    const meeting = await this.findByIdForUser(meetingId, user);
    const agentName = process.env.AGENT_IDENTITY || 'quo-agent';
    return this.livekitService.dispatchAgent(meeting.roomName, agentName);
  }

  // =============================================
  // Host Controls (Phase 3)
  // =============================================

  /**
   * Validate that the requesting user is the host of this meeting.
   * Returns the meeting if valid, throws ForbiddenException otherwise.
   */
  private async validateHost(meetingId: string, user: User): Promise<Meeting> {
    const meeting = await this.findById(meetingId);
    if (meeting.hostId !== user.id) {
      throw new ForbiddenException('Only the host can perform this action');
    }
    return meeting;
  }

  /**
   * List participants currently in the LiveKit room for a meeting.
   */
  async getParticipants(meetingId: string, user: User) {
    const meeting = await this.findByIdForUser(meetingId, user);
    return this.livekitService.listRoomParticipants(meeting.roomName);
  }

  /**
   * Mute a participant's track (host only).
   */
  async muteParticipant(
    meetingId: string,
    identity: string,
    trackSid: string,
    muted: boolean,
    user: User,
  ) {
    const meeting = await this.validateHost(meetingId, user);
    return this.livekitService.muteParticipant(
      meeting.roomName,
      identity,
      trackSid,
      muted,
    );
  }

  /**
   * Kick a participant from the room (host only).
   */
  async kickParticipant(
    meetingId: string,
    identity: string,
    user: User,
  ) {
    const meeting = await this.validateHost(meetingId, user);
    return this.livekitService.removeParticipant(meeting.roomName, identity);
  }
  // =============================================
  // Recording Controls (Phase 4)
  // =============================================

  async startRecording(meetingId: string, user: User) {
    const meeting = await this.validateHost(meetingId, user);
    
    const filename = `recording_${meeting.id}_${Date.now()}.mp4`;

    try {
      const egressInfo = await this.livekitService.startRoomRecording(meeting.roomName, filename);
      
      const recording = this.recordingRepo.create({
        egressId: egressInfo.egressId,
        meetingId: meeting.id,
        status: 'starting',
        storageUrl: filename, // Just saving the filename for now, S3 URL can be constructed or updated later
      });
      await this.recordingRepo.save(recording);
      return recording;
    } catch (e) {
      this.logger.error('Failed to start egress', e);
      throw e;
    }
  }

  async stopRecording(meetingId: string, egressId: string, user: User) {
    const meeting = await this.validateHost(meetingId, user);
    const recording = await this.recordingRepo.findOne({ where: { egressId, meetingId: meeting.id } });
    if (!recording) throw new NotFoundException('Recording not found');

    const egressInfo = await this.livekitService.stopRoomRecording(egressId);
    recording.status = 'stopping';
    await this.recordingRepo.save(recording);
    return recording;
  }

  async getRecordings(meetingId: string, user: User) {
    const meeting = await this.findById(meetingId);
    if (meeting.orgId !== user.orgId) {
      throw new ForbiddenException('Cannot access recordings for this meeting');
    }
    return this.recordingRepo.find({
      where: { meetingId },
      order: { createdAt: 'DESC' },
    });
  }

  async updateRecordingEgress(egressId: string, status: string, durationMs?: number) {
    const recording = await this.recordingRepo.findOne({ where: { egressId } });
    if (!recording) {
      this.logger.warn(`Recording not found for egressId: ${egressId}`);
      return;
    }
    
    recording.status = status;
    if (durationMs) {
      recording.durationMs = durationMs;
    }
    await this.recordingRepo.save(recording);
    return recording;
  }
}
