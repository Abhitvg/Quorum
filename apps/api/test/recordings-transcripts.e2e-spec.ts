import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { JwtService } from '@nestjs/jwt';

describe('Recordings and Transcripts (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;

  const mockLivekitService = {
    startRoomRecording: jest.fn().mockResolvedValue({ egressId: 'mock-egress-id' }),
    stopRoomRecording: jest.fn().mockResolvedValue({}),
    broadcastData: jest.fn().mockResolvedValue(null),
    generateToken: jest.fn().mockResolvedValue('mock-token'),
    getServerUrl: jest.fn().mockReturnValue('wss://mock.livekit'),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider('LivekitService')
      .useValue(mockLivekitService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();

    jwtService = app.get(JwtService);
  });

  afterAll(async () => {
    await app.close();
  });

  const getAuthToken = (user: any) => jwtService.sign(user);

  it('org isolation: user2 cannot view recordings for user1 meeting, but user3 (same org) can', async () => {
    // 1. Setup users
    const user1 = { id: 'user1', email: 'u1@test.com', name: 'User1', orgId: 'org1' };
    const user2 = { id: 'user2', email: 'u2@test.com', name: 'User2', orgId: 'org2' }; // Different org
    const user3 = { id: 'user3', email: 'u3@test.com', name: 'User3', orgId: 'org1' }; // Same org as user1

    // 2. user1 creates meeting
    const createRes = await request(app.getHttpServer())
      .post('/meetings')
      .set('Authorization', `Bearer ${getAuthToken(user1)}`)
      .send({ title: 'Org1 Meeting' });
    
    expect(createRes.status).toBe(201);
    const meetingId = createRes.body.meeting.id;

    // 3. user2 (org2) attempts to fetch recordings for user1's meeting (org1) -> 403 Forbidden
    const getResOrg2 = await request(app.getHttpServer())
      .get(`/meetings/${meetingId}/recordings`)
      .set('Authorization', `Bearer ${getAuthToken(user2)}`)
      .send();

    expect(getResOrg2.status).toBe(403);

    // 4. user3 (org1) attempts to fetch recordings for user1's meeting (org1) -> 200 OK
    const getResOrg1 = await request(app.getHttpServer())
      .get(`/meetings/${meetingId}/recordings`)
      .set('Authorization', `Bearer ${getAuthToken(user3)}`)
      .send();

    expect(getResOrg1.status).toBe(200);
    expect(getResOrg1.body.recordings).toBeDefined();
  });
});
