import { Controller, Post, Req, Res, Headers } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { WebhookReceiver } from 'livekit-server-sdk';
import { MeetingsService } from '../meetings/meetings.service';

@Controller('livekit')
export class LivekitController {
  private receiver: WebhookReceiver;

  constructor(
    private readonly config: ConfigService,
    private readonly meetingsService: MeetingsService,
  ) {
    const apiKey = this.config.get<string>('livekit.apiKey', process.env.LIVEKIT_API_KEY || '');
    const apiSecret = this.config.get<string>('livekit.apiSecret', process.env.LIVEKIT_API_SECRET || '');
    this.receiver = new WebhookReceiver(apiKey, apiSecret);
  }

  @Post('webhook')
  async handleWebhook(
    @Req() req: Request,
    @Res() res: Response,
    @Headers('Authorization') authHeader: string,
  ) {
    if (!authHeader) {
      return res.status(401).send('Missing Authorization header');
    }

    try {
      // LiveKit sdk WebhookReceiver expects body as a string. NestJS parses body to JSON automatically 
      // if using built-in body-parser, so we might need raw body if configured. 
      // Assuming we can convert it back to string if needed, or we use req.rawBody.
      // Usually req.rawBody or req.body works depending on the NestJS setup.
      // NestJS body parser can be bypassed or we can use JSON.stringify for this basic example.
      let bodyString = req.body;
      if (typeof req.body === 'object') {
        // Fallback if NestJS has already parsed it (might have signature mismatch if formatting differs)
        // A robust solution uses raw body parser middleware. For now:
        bodyString = (req as any).rawBody ? (req as any).rawBody.toString() : JSON.stringify(req.body);
      }

      const event = await this.receiver.receive(bodyString, authHeader);
      
      if (event.event === 'egress_ended' && event.egressInfo) {
        const egressId = event.egressInfo.egressId;
        const status = event.egressInfo.status === 3 ? 'complete' : 'failed'; // EgressStatus.EGRESS_COMPLETE = 3
        
        // Duration is in nanoseconds (number or string representation)
        // Livekit doesn't provide a direct duration field sometimes, we can derive from startedAt/updatedAt
        const startedAt = Number(event.egressInfo.startedAt);
        const updatedAt = Number(event.egressInfo.updatedAt);
        const durationNs = (updatedAt && startedAt) ? (updatedAt - startedAt) : 0;
        const durationMs = durationNs ? Math.floor(durationNs / 1e6) : 0;
        
        await this.meetingsService.updateRecordingEgress(egressId, status, durationMs);
      }

      res.status(200).send('OK');
    } catch (error) {
      console.error('Webhook processing failed:', error);
      res.status(500).send('Error processing webhook');
    }
  }
}
