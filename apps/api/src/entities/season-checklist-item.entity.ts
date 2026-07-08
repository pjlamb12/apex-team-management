import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { SeasonEntity } from './season.entity';
import { SeasonChecklistValueEntity } from './season-checklist-value.entity';

@Entity('season_checklist_items')
export class SeasonChecklistItemEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'season_id' })
  seasonId: string;

  @ManyToOne(() => SeasonEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'season_id' })
  season: SeasonEntity;

  @Column()
  name: string;

  @Column({ name: 'sort_order', type: 'integer', default: 0 })
  sortOrder: number;

  @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @OneToMany(() => SeasonChecklistValueEntity, (val) => val.item)
  values: SeasonChecklistValueEntity[];
}
