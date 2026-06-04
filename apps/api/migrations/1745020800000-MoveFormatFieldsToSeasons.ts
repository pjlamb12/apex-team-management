import { MigrationInterface, QueryRunner } from 'typeorm';

export class MoveFormatFieldsToSeasons1745020800000 implements MigrationInterface {
  name = 'MoveFormatFieldsToSeasons1745020800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Step 1: Add nullable format columns to seasons
    // Nullable because season creation UI is deferred (Phase deferred) — existing rows get NULL
    await queryRunner.query(`
      ALTER TABLE "seasons"
        ADD COLUMN "players_on_field" integer,
        ADD COLUMN "period_count" integer,
        ADD COLUMN "period_length_minutes" integer
    `);

    // Step 2: Add coach_id FK to teams (nullable initially, then enforce NOT NULL)
    // Using the two-step pattern from AddAuthColumns: add nullable, populate, enforce
    // No existing teams data needs populating — add NOT NULL with a temporary default
    await queryRunner.query(`
      ALTER TABLE "teams"
        ADD COLUMN "coach_id" uuid
    `);
    await queryRunner.query(`
      ALTER TABLE "teams"
        ADD CONSTRAINT "FK_teams_coach" FOREIGN KEY ("coach_id") REFERENCES "users"("id") ON DELETE CASCADE
    `);
    // Note: coach_id is nullable at DB level for migration safety.
    // TeamsService enforces coachId from JWT on every create call.

    // Step 3: Drop format columns from teams
    await queryRunner.query(`
      ALTER TABLE "teams"
        DROP COLUMN "players_on_field",
        DROP COLUMN "period_count",
        DROP COLUMN "period_length_minutes"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Restore format columns to teams
    await queryRunner.query(`
      ALTER TABLE "teams"
        ADD COLUMN "players_on_field" integer NOT NULL DEFAULT 11,
        ADD COLUMN "period_count" integer NOT NULL DEFAULT 2,
        ADD COLUMN "period_length_minutes" integer NOT NULL DEFAULT 45
    `);

    // Remove coach_id from teams
    await queryRunner.query(`
      ALTER TABLE "teams"
        DROP CONSTRAINT IF EXISTS "FK_teams_coach"
    `);
    await queryRunner.query(`
      ALTER TABLE "teams"
        DROP COLUMN IF EXISTS "coach_id"
    `);

    // Remove format columns from seasons
    await queryRunner.query(`
      ALTER TABLE "seasons"
        DROP COLUMN IF EXISTS "players_on_field",
        DROP COLUMN IF EXISTS "period_count",
        DROP COLUMN IF EXISTS "period_length_minutes"
    `);
  }
}
