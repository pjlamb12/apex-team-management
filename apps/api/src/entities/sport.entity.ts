import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('sports')
export class SportEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ name: 'position_types', type: 'jsonb', default: [] })
  positionTypes: string[];

  @Column({ name: 'event_definitions', type: 'jsonb', default: [] })
  eventDefinitions: any[];

  @Column({ name: 'is_enabled', default: true })
  isEnabled: boolean;
}
