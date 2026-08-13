import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Org } from '../../orgs/entities/org.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255, unique: true })
  email: string;

  @Column({ name: 'password_hash', length: 255, nullable: true })
  passwordHash: string | null;

  @Column({ length: 255 })
  name: string;

  @Column({ name: 'avatar_url', type: 'text', nullable: true })
  avatarUrl: string | null;

  @Column({ name: 'org_id' })
  orgId: string;

  @ManyToOne(() => Org, (org) => org.users)
  @JoinColumn({ name: 'org_id' })
  org: Org;

  @Column({ name: 'google_id', length: 255, nullable: true, unique: true })
  googleId: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
