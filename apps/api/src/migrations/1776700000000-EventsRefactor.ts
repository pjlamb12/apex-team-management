import { MigrationInterface, QueryRunner } from 'typeorm';

export class EventsRefactor1776700000000 implements MigrationInterface {
  name = 'EventsRefactor1776700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Rename games table to events
    await queryRunner.query(`ALTER TABLE "games" RENAME TO "events"`);

    // 2. Add type, duration_minutes, and notes columns
    await queryRunner.query(`ALTER TABLE "events" ADD "type" character varying NOT NULL DEFAULT 'game'`);
    await queryRunner.query(`ALTER TABLE "events" ADD "duration_minutes" integer`);
    await queryRunner.query(`ALTER TABLE "events" ADD "notes" text`);

    // 3. Rename game_id to event_id in related tables
    await queryRunner.query(`ALTER TABLE "game_events" RENAME COLUMN "game_id" TO "event_id"`);
    await queryRunner.query(`ALTER TABLE "lineup_entries" RENAME COLUMN "game_id" TO "event_id"`);

    // 4. Rename constraints where we are sure about the name
    await queryRunner.query(`ALTER TABLE "events" RENAME CONSTRAINT "PK_games" TO "PK_events"`);
    // Note: Other constraints like FK_games_season may have been renamed to generated strings 
    // by TypeORM in previous migrations, so we only rename the ones we are confident about.
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reverse the changes in reverse order
    await queryRunner.query(`ALTER TABLE "events" RENAME CONSTRAINT "PK_events" TO "PK_games"`);
    await queryRunner.query(`ALTER TABLE "lineup_entries" RENAME COLUMN "event_id" TO "game_id"`);
    await queryRunner.query(`ALTER TABLE "game_events" RENAME COLUMN "event_id" TO "game_id"`);
    await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "notes"`);
    await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "duration_minutes"`);
    await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "type"`);
    await queryRunner.query(`ALTER TABLE "events" RENAME TO "games"`);
  }
}
