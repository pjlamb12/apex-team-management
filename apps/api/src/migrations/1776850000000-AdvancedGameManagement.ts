import { MigrationInterface, QueryRunner } from 'typeorm';

export class AdvancedGameManagement1776850000000 implements MigrationInterface {
  name = 'AdvancedGameManagement1776850000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "events"
        ADD COLUMN "period_count" integer,
        ADD COLUMN "period_length_minutes" integer,
        ADD COLUMN "current_period" integer NOT NULL DEFAULT 1
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "events"
        DROP COLUMN IF EXISTS "period_count",
        DROP COLUMN IF EXISTS "period_length_minutes",
        DROP COLUMN IF EXISTS "current_period"
    `);
  }
}
