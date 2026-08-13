import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AccessToken, RoomServiceClient, EgressClient, EncodedFileOutput, EncodedFileType, S3Upload } from 'livekit-server-sdk';

@Injectable()
export class LivekitService {
  private readonly apiKey: string;
  private readonly apiSecret: string;
  private readonly url: string;
  private readonly roomService: RoomServiceClient;
  private readonly egressClient: EgressClient;

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.get<string>('livekit.apiKey', '');
    this.apiSecret = this.config.get<string>('livekit.apiSecret', '');
    this.url = this.config.get<string>('livekit.url', '');

    // RoomServiceClient uses the HTTP URL, not the WebSocket URL
    const httpUrl = this.url.replace('wss://', 'https://').replace('ws://', 'http://');
    this.roomService = new RoomServiceClient(httpUrl, this.apiKey, this.apiSecret);
    this.egressClient = new EgressClient(httpUrl, this.apiKey, this.apiSecret);
  }

  /**
   * Generate a LiveKit access token for a participant joining a room.
   * The token grants permissions to publish and subscribe to audio/video.
   */
  async generateToken(
    roomName: string,
    participantIdentity: string,
    participantName: string,
  ): Promise<string> {
    const token = new AccessToken(this.apiKey, this.apiSecret, {
      identity: participantIdentity,
      name: participantName,
    });

    token.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    return await token.toJwt();
  }

  /**
   * Get the LiveKit server URL for client connections.
   */
  getServerUrl(): string {
    return this.url;
  }

  // =============================================
  // Room Management (Phase 3 — Host Controls)
  // =============================================

  /**
   * List participants currently in a LiveKit room.
   */
  async listRoomParticipants(roomName: string) {
    return this.roomService.listParticipants(roomName);
  }

  /**
   * Mute or unmute a participant's published track.
   * @param roomName - LiveKit room name
   * @param identity - participant identity (user ID)
   * @param trackSid - SID of the track to mute
   * @param muted - true to mute, false to unmute
   */
  async muteParticipant(
    roomName: string,
    identity: string,
    trackSid: string,
    muted: boolean,
  ) {
    return this.roomService.mutePublishedTrack(roomName, identity, trackSid, muted);
  }

  /**
   * Remove a participant from a LiveKit room.
   * The participant will be disconnected but can rejoin.
   */
  async removeParticipant(roomName: string, identity: string) {
    return this.roomService.removeParticipant(roomName, identity);
  }

  /**
   * Update a participant's permissions (e.g. revoke publish rights).
   */
  async updateParticipantPermissions(
    roomName: string,
    identity: string,
    permissions: { canPublish?: boolean; canSubscribe?: boolean; canPublishData?: boolean },
  ) {
    return this.roomService.updateParticipant(roomName, identity, {
      permission: permissions,
    });
  }
  // =============================================
  // Phase 4 — Recording & Transcription
  // =============================================

  /**
   * Start a RoomCompositeEgress for the given room.
   */
  async startRoomRecording(roomName: string, filename: string) {
    const s3AccessKey = this.config.get<string>('livekit.s3AccessKey', process.env.S3_ACCESS_KEY_ID || '');
    const s3SecretKey = this.config.get<string>('livekit.s3SecretKey', process.env.S3_SECRET_ACCESS_KEY || '');
    const s3Region = this.config.get<string>('livekit.s3Region', process.env.S3_REGION || 'us-east-1');
    const s3Bucket = this.config.get<string>('livekit.s3Bucket', process.env.S3_BUCKET || '');

    const fileOutput = new EncodedFileOutput({
      filepath: filename,
      fileType: EncodedFileType.MP4,
      output: {
        case: 's3',
        value: new S3Upload({
          accessKey: s3AccessKey,
          secret: s3SecretKey,
          region: s3Region,
          bucket: s3Bucket,
        }),
      },
    });
    return this.egressClient.startRoomCompositeEgress(roomName, {
      file: fileOutput,
    });
  }

  /**
   * Stop an active egress.
   */
  async stopRoomRecording(egressId: string) {
    return this.egressClient.stopEgress(egressId);
  }

  /**
   * Broadcast data to all participants in a room via LiveKit Data Channels.
   */
  async broadcastData(roomName: string, data: any, topic?: string) {
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(JSON.stringify(data));
    return this.roomService.sendData(roomName, encodedData, 1, { topic });
  }
}
