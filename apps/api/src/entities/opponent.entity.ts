import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TeamEntity } from './team.entity';
import { EventEntity } from './event.entity';
import { DangerPlayer, OpponentScoutingNote, ThreatLevel } from '@apex-team/shared/util/models';

@Entity('opponents')
export class OpponentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => TeamEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'team_id' })
  team: TeamEntity;

  @Column({ name: 'team_id' })
  teamId: string;

  @Column()
  name: string;

  @Column({ name: 'coach_name', type: 'varchar', nullable: true })
  coachName: string | null;

  @Column({ name: 'contact_info', type: 'varchar', nullable: true })
  contactInfo: string | null;

  @Column({ name: 'primary_color', type: 'varchar', nullable: true })
  primaryColor: string | null;

  @Column({ name: 'secondary_color', type: 'varchar', nullable: true })
  secondaryColor: string | null;

  @Column({ type: 'varchar', nullable: true })
  formation: string | null;

  @Column({ name: 'threat_level', type: 'varchar', nullable: true, default: 'medium' })
  threatLevel: ThreatLevel | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'text', nullable: true })
  tendencies: string | null;

  @Column({ name: 'danger_players', type: 'jsonb', nullable: true, default: () => "'[]'" })
  dangerPlayers: DangerPlayer[];

  @Column({ name: 'scouting_notes', type: 'jsonb', nullable: true, default: () => "'[]'" })
  scoutingNotes: OpponentScoutingNote[];

  @OneToMany(() => EventEntity, (event) => event.opponentRef)
  events: EventEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
