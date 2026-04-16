import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'display_name' })
  displayName: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'password_hash' })
  passwordHash: string;

  @Column({ name: 'password_reset_token', nullable: true, type: 'varchar' })
  passwordResetToken: string | null;

  @Column({ name: 'password_reset_expiry', type: 'timestamp', nullable: true })
  passwordResetExpiry: Date | null;
}
