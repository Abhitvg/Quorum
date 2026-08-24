import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Meeting } from '../../meetings/entities/meeting.entity';

@Entity('transcripts')
export class Transcript {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  meetingId: string;

  @ManyToOne(() => Meeting, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'meetingId' })
  meeting: Meeting;

  @Column({ type: 'varchar' })
  speakerIdentity: string;

  @Column({ type: 'text' })
  text: string;

  @Column({ type: 'boolean', default: false })
  isFinal: boolean;

  @Column({ type: 'int' })
  startMs: number;

  @Column({ type: 'int' })
  endMs: number;

  @Column({ type: 'float' })
  confidence: number;

  @CreateDateColumn()
  timestamp: Date;
}
