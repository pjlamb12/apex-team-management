import { MigrationInterface, QueryRunner } from 'typeorm';

export class GamesLineupPhase1776489800000 implements MigrationInterface {
  name = 'GamesLineupPhase1776489800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "games"
        ADD COLUMN IF NOT EXISTS "location" character varying,
        ADD COLUMN IF NOT EXISTS "uniform_color" character varying,
        ADD COLUMN IF NOT EXISTS "status" character varying NOT NULL DEFAULT 'scheduled'
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "lineup_entries" (
        "id" uuid DEFAULT gen_random_uuid() NOT NULL,
        "game_id" uuid NOT NULL,
        "player_id" uuid NOT NULL,
        "position_name" character varying,
        "status" character varying NOT NULL DEFAULT 'bench',
        CONSTRAINT "PK_lineup_entries" PRIMARY KEY ("id"),
        CONSTRAINT "FK_lineup_entries_game" FOREIGN KEY ("game_id")
          REFERENCES "games"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_lineup_entries_player" FOREIGN KEY ("player_id")
          REFERENCES "players"("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "lineup_entries"
    `);

    await queryRunner.query(`
      ALTER TABLE "games"
        DROP COLUMN IF EXISTS "status",
        DROP COLUMN IF EXISTS "uniform_color",
        DROP COLUMN IF EXISTS "location"
    `);
  }
}
