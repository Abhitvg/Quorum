import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Meeting } from './meeting.entity';
import { User } from '../../users/entities/user.entity';

@Entity('participants')
export class Participant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'meeting_id' })
  meetingId: string;

  @ManyToOne(() => Meeting, (meeting) => meeting.participants)
  @JoinColumn({ name: 'meeting_id' })
  meeting: Meeting;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @CreateDateColumn({ name: 'joined_at' })
  joinedAt: Date;

  @Column({ name: 'left_at', type: 'timestamptz', nullable: true })
  leftAt: Date | null;
}
