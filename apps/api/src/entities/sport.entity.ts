import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('sports')
export class SportEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ type: 'jsonb', default: [] })
  positionTypes: string[];

  @Column({ default: true })
  isEnabled: boolean;
}
