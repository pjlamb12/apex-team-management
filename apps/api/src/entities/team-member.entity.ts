import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { TeamRole } from '@apex-team/shared/util/models';
import { TeamEntity } from './team.entity';
import { UserEntity } from './user.entity';

@Entity('team_members')
export class TeamMemberEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => TeamEntity, (team) => team.members)
  @JoinColumn({ name: 'team_id' })
  team: TeamEntity;

  @Column({ name: 'team_id' })
  teamId: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({
    type: 'enum',
    enum: TeamRole,
    default: TeamRole.ASSISTANT
  })
  role: TeamRole;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
