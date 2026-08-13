import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { LivekitService } from './livekit.service';
import * as jwt from 'jsonwebtoken';

// Mock the RoomServiceClient
const mockRoomServiceClient = {
  listParticipants: jest.fn(),
  mutePublishedTrack: jest.fn(),
  removeParticipant: jest.fn(),
  updateParticipant: jest.fn(),
};

jest.mock('livekit-server-sdk', () => {
  const actual = jest.requireActual('livekit-server-sdk');
  return {
    ...actual,
    RoomServiceClient: jest.fn().mockImplementation(() => mockRoomServiceClient),
  };
});

describe('LivekitService', () => {
  let service: LivekitService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LivekitService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultVal?: any) => {
              if (key === 'livekit.apiKey') return 'test-api-key';
              if (key === 'livekit.apiSecret') return 'test-api-secret';
              if (key === 'livekit.url') return 'wss://test.livekit.cloud';
              return defaultVal ?? null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<LivekitService>(LivekitService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateToken', () => {
    it('should generate a valid JWT token with correct grants', async () => {
      const roomName = 'qr-12345';
      const identity = 'user-1';
      const name = 'Alice';

      const tokenString = await service.generateToken(roomName, identity, name);
      expect(typeof tokenString).toBe('string');

      const decoded = jwt.decode(tokenString) as any;
      expect(decoded).toBeDefined();
      expect(decoded.iss).toBe('test-api-key');
      expect(decoded.sub).toBe(identity);
      expect(decoded.name).toBe(name);
      expect(decoded.video).toBeDefined();
      expect(decoded.video.roomJoin).toBe(true);
      expect(decoded.video.room).toBe(roomName);
    });
  });

  describe('Room Management (Phase 3)', () => {
    it('should list room participants', async () => {
      mockRoomServiceClient.listParticipants.mockResolvedValue([
        { identity: 'user-1', name: 'Alice' },
        { identity: 'user-2', name: 'Bob' },
      ]);

      const result = await service.listRoomParticipants('qr-12345');
      expect(mockRoomServiceClient.listParticipants).toHaveBeenCalledWith('qr-12345');
      expect(result).toHaveLength(2);
    });

    it('should mute a participant track', async () => {
      mockRoomServiceClient.mutePublishedTrack.mockResolvedValue({ sid: 'TR_123', muted: true });

      const result = await service.muteParticipant('qr-12345', 'user-1', 'TR_123', true);
      expect(mockRoomServiceClient.mutePublishedTrack).toHaveBeenCalledWith(
        'qr-12345',
        'user-1',
        'TR_123',
        true,
      );
      expect(result.muted).toBe(true);
    });

    it('should remove a participant from a room', async () => {
      mockRoomServiceClient.removeParticipant.mockResolvedValue(undefined);

      await service.removeParticipant('qr-12345', 'user-1');
      expect(mockRoomServiceClient.removeParticipant).toHaveBeenCalledWith('qr-12345', 'user-1');
    });

    it('should update participant permissions', async () => {
      mockRoomServiceClient.updateParticipant.mockResolvedValue({ identity: 'user-1' });

      await service.updateParticipantPermissions('qr-12345', 'user-1', {
        canPublish: false,
      });
      expect(mockRoomServiceClient.updateParticipant).toHaveBeenCalledWith(
        'qr-12345',
        'user-1',
        { permission: { canPublish: false } },
      );
    });
  });
});
