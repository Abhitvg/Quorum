import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transcript } from './entities/transcript.entity';

@Injectable()
export class TranscriptsService {
  constructor(
    @InjectRepository(Transcript)
    private readonly transcriptRepo: Repository<Transcript>,
  ) {}

  async saveTranscript(data: {
    meetingId: string;
    speakerIdentity: string;
    speakerName?: string;
    text: string;
    isFinal: boolean;
    startMs: number;
    endMs: number;
    confidence: number;
  }): Promise<Transcript> {
    const transcript = this.transcriptRepo.create(data);
    return this.transcriptRepo.save(transcript);
  }

  async getTranscripts(meetingId: string): Promise<Transcript[]> {
    return this.transcriptRepo.find({
      where: { meetingId, isFinal: true },
      order: { timestamp: 'ASC' },
    });
  }
}
