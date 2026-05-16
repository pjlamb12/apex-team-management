import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSeasonPlayers1779200000000 implements MigrationInterface {
  name = 'CreateSeasonPlayers1779200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create season_players table
    await queryRunner.query(`
      CREATE TABLE "season_players" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "season_id" uuid NOT NULL,
        "player_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_season_players" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_season_player" UNIQUE ("season_id", "player_id"),
        CONSTRAINT "FK_season_players_season" FOREIGN KEY ("season_id") REFERENCES "seasons"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_season_players_player" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE CASCADE
      )
    `);

    // 2. Migration logic: For all existing players, add them to the active season of their team
    await queryRunner.query(`
      INSERT INTO "season_players" ("season_id", "player_id")
      SELECT s.id, p.id
      FROM "players" p
      JOIN "seasons" s ON p.team_id = s.team_id
      WHERE s.is_active = true
      ON CONFLICT DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "season_players"`);
  }
}
