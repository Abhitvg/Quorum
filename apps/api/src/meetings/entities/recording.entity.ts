import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Meeting } from './meeting.entity';

@Entity('recordings')
export class Recording {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true })
  egressId: string;

  @Column({ type: 'uuid' })
  meetingId: string;

  @ManyToOne(() => Meeting, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'meetingId' })
  meeting: Meeting;

  // TODO: Add LiveKit egress_ended webhook listener to transition from stopping -> complete and populate durationMs
  @Column({ type: 'varchar', length: 50, default: 'starting' })
  status: string; // starting, active, stopping, complete, failed

  @Column({ type: 'varchar', nullable: true })
  storageUrl: string;

  @Column({ type: 'int', nullable: true })
  durationMs: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
