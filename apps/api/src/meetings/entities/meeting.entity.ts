import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Org } from '../../orgs/entities/org.entity';
import { Participant } from './participant.entity';

@Entity('meetings')
export class Meeting {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  title: string;

  @Column({ name: 'host_id' })
  hostId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'host_id' })
  host: User;

  @Column({ name: 'org_id' })
  orgId: string;

  @ManyToOne(() => Org, (org) => org.meetings)
  @JoinColumn({ name: 'org_id' })
  org: Org;

  @Column({ name: 'room_name', length: 255, unique: true })
  roomName: string;

  @Column({ length: 20, default: 'scheduled' })
  status: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'started_at', type: 'timestamptz', nullable: true })
  startedAt: Date | null;

  @Column({ name: 'ended_at', type: 'timestamptz', nullable: true })
  endedAt: Date | null;

  @OneToMany(() => Participant, (p) => p.meeting)
  participants: Participant[];
}
