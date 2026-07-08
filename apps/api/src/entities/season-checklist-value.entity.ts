import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { PlayerEntity } from './player.entity';
import { SeasonChecklistItemEntity } from './season-checklist-item.entity';

@Entity('season_checklist_values')
@Unique('UQ_season_checklist_values_player_item', ['playerId', 'itemId'])
export class SeasonChecklistValueEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'player_id' })
  playerId: string;

  @ManyToOne(() => PlayerEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'player_id' })
  player: PlayerEntity;

  @Column({ name: 'item_id' })
  itemId: string;

  @ManyToOne(() => SeasonChecklistItemEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'item_id' })
  item: SeasonChecklistItemEntity;

  @Column({ nullable: true })
  value: string | null; // 'Yes', 'No', 'N/A', or null

  @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ name: 'updated_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
