import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import cookieParser from 'cookie-parser';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let user1Cookie: string[];
  let user2Cookie: string[];
  let user1MeetingId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Authentication flow', () => {
    it('should register a new user and return a cookie', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'alice@example.com',
          password: 'Password123',
          name: 'Alice',
        })
        .expect(201);

      expect((response.body as { user: { email: string } }).user).toBeDefined();
      expect((response.body as { user: { email: string } }).user.email).toBe(
        'alice@example.com',
      );

      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies[0]).toMatch(/qr_token=/);
      user1Cookie = cookies as unknown as string[];
    });

    it('should fetch the logged-in user details', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Cookie', user1Cookie)
        .expect(200);

      expect((response.body as { user: { name: string } }).user.name).toBe(
        'Alice',
      );
    });

    it('should reject unauthenticated access to /auth/me', async () => {
      await request(app.getHttpServer()).get('/auth/me').expect(401);
    });

    it('should log in an existing user', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'alice@example.com',
          password: 'Password123',
        })
        .expect(200);

      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
    });
  });

  describe('Multi-tenancy and Meetings', () => {
    it('should create a second user (user2) in a separate org', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'bob@example.com',
          password: 'Password123',
          name: 'Bob',
        })
        .expect(201);

      user2Cookie = response.headers['set-cookie'] as unknown as string[];
    });

    it('user1 creates a meeting', async () => {
      const response = await request(app.getHttpServer())
        .post('/meetings')
        .set('Cookie', user1Cookie)
        .send({ title: 'Alice Sync' })
        .expect(201);

      expect(
        (response.body as { meeting: { title: string; id: string } }).meeting,
      ).toBeDefined();
      expect(
        (response.body as { meeting: { title: string; id: string } }).meeting
          .title,
      ).toBe('Alice Sync');
      user1MeetingId = (
        response.body as { meeting: { title: string; id: string } }
      ).meeting.id;
    });

    it('user1 can see their meeting', async () => {
      const response = await request(app.getHttpServer())
        .get('/meetings')
        .set('Cookie', user1Cookie)
        .expect(200);

      expect(
        (response.body as { meetings: unknown[] }).meetings.length,
      ).toBeGreaterThanOrEqual(1);
      const meeting = (
        response.body as { meetings: Array<Record<string, unknown>> }
      ).meetings.find((m: Record<string, unknown>) => m.id === user1MeetingId);
      expect(meeting).toBeDefined();
    });

    it("user2 cannot see user1's meeting in list", async () => {
      const response = await request(app.getHttpServer())
        .get('/meetings')
        .set('Cookie', user2Cookie)
        .expect(200);

      const meeting = (
        response.body as { meetings: Array<Record<string, unknown>> }
      ).meetings.find((m: Record<string, unknown>) => m.id === user1MeetingId);
      expect(meeting).toBeUndefined(); // Should not be in the list
    });
  });

  describe('Phase 3: Host Controls Authorization', () => {
    it('should reject mute participant request from non-host (user2)', async () => {
      const response = await request(app.getHttpServer())
        .post(`/meetings/${user1MeetingId}/participants/some-identity/mute`)
        .set('Cookie', user2Cookie)
        .send({ trackSid: 'TR_123', muted: true })
        .expect(403);

      expect((response.body as { message: string }).message).toBe(
        'Only the host can perform this action',
      );
    });

    it('should reject kick participant request from non-host (user2)', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/meetings/${user1MeetingId}/participants/some-identity`)
        .set('Cookie', user2Cookie)
        .expect(403);

      expect((response.body as { message: string }).message).toBe(
        'Only the host can perform this action',
      );
    });
  });
});
