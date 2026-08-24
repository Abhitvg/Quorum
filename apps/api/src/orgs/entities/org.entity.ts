import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Meeting } from '../../meetings/entities/meeting.entity';

@Entity('organizations')
export class Org {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 50, default: 'personal' })
  plan: string;

  @Column({
    name: 'data_residency_region',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  dataResidencyRegion: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => User, (user) => user.org)
  users: User[];

  @OneToMany(() => Meeting, (meeting) => meeting.org)
  meetings: Meeting[];
}
