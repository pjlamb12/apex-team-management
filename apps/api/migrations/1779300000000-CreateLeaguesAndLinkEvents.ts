import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateLeaguesAndLinkEvents1779300000000 implements MigrationInterface {
  name = 'CreateLeaguesAndLinkEvents1779300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create leagues table
    await queryRunner.query(`
      CREATE TABLE "leagues" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "season_id" uuid NOT NULL,
        "name" character varying NOT NULL,
        "type" character varying NOT NULL DEFAULT 'league',
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_leagues" PRIMARY KEY ("id"),
        CONSTRAINT "FK_leagues_season" FOREIGN KEY ("season_id") REFERENCES "seasons"("id") ON DELETE CASCADE
      )
    `);

    // 2. Add league_id to events
    await queryRunner.query(`ALTER TABLE "events" ADD "league_id" uuid`);
    await queryRunner.query(`
      ALTER TABLE "events" 
      ADD CONSTRAINT "FK_events_league" 
      FOREIGN KEY ("league_id") REFERENCES "leagues"("id") ON DELETE SET NULL
    `);

    // 3. Data Migration: Create a "Main League" for every existing season
    // and link existing events of type 'game' to it.
    
    // First, find all seasons
    const seasons = await queryRunner.query(`SELECT "id", "name" FROM "seasons"`);
    
    for (const season of seasons) {
      // Create a default league for this season
      const leagueName = `${season.name} - General`;
      const result = await queryRunner.query(
        `INSERT INTO "leagues" ("season_id", "name", "type") VALUES ($1, $2, 'league') RETURNING "id"`,
        [season.id, leagueName]
      );
      const leagueId = result[0].id;

      // Update all events for this season to point to this league
      // We'll update ALL events for simplicity, though the UI will focus on games
      await queryRunner.query(
        `UPDATE "events" SET "league_id" = $1 WHERE "season_id" = $2`,
        [leagueId, season.id]
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "events" DROP CONSTRAINT "FK_events_league"`);
    await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "league_id"`);
    await queryRunner.query(`DROP TABLE "leagues"`);
  }
}
