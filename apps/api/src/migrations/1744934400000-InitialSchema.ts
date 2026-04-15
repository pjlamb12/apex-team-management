import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1744934400000 implements MigrationInterface {
  name = 'InitialSchema1744934400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // sports table — no FK dependencies
    await queryRunner.query(`
      CREATE TABLE "sports" (
        "id" uuid DEFAULT gen_random_uuid() NOT NULL,
        "name" character varying NOT NULL,
        "position_types" jsonb NOT NULL DEFAULT '[]',
        "is_enabled" boolean NOT NULL DEFAULT true,
        CONSTRAINT "UQ_sports_name" UNIQUE ("name"),
        CONSTRAINT "PK_sports" PRIMARY KEY ("id")
      )
    `);

    // users table — no FK dependencies
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid DEFAULT gen_random_uuid() NOT NULL,
        "email" character varying NOT NULL,
        "display_name" character varying NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      )
    `);

    // teams table — depends on sports
    await queryRunner.query(`
      CREATE TABLE "teams" (
        "id" uuid DEFAULT gen_random_uuid() NOT NULL,
        "name" character varying NOT NULL,
        "sport_id" uuid NOT NULL,
        "players_on_field" integer NOT NULL DEFAULT 11,
        "period_count" integer NOT NULL DEFAULT 2,
        "period_length_minutes" integer NOT NULL DEFAULT 45,
        CONSTRAINT "PK_teams" PRIMARY KEY ("id"),
        CONSTRAINT "FK_teams_sport" FOREIGN KEY ("sport_id") REFERENCES "sports"("id")
      )
    `);

    // players table — depends on teams
    await queryRunner.query(`
      CREATE TABLE "players" (
        "id" uuid DEFAULT gen_random_uuid() NOT NULL,
        "first_name" character varying NOT NULL,
        "last_name" character varying NOT NULL,
        "jersey_number" integer,
        "preferred_position" character varying,
        "team_id" uuid NOT NULL,
        CONSTRAINT "PK_players" PRIMARY KEY ("id"),
        CONSTRAINT "FK_players_team" FOREIGN KEY ("team_id") REFERENCES "teams"("id")
      )
    `);

    // seasons table — depends on teams
    await queryRunner.query(`
      CREATE TABLE "seasons" (
        "id" uuid DEFAULT gen_random_uuid() NOT NULL,
        "team_id" uuid NOT NULL,
        "name" character varying NOT NULL,
        "start_date" date,
        "end_date" date,
        "is_active" boolean NOT NULL DEFAULT false,
        CONSTRAINT "PK_seasons" PRIMARY KEY ("id"),
        CONSTRAINT "FK_seasons_team" FOREIGN KEY ("team_id") REFERENCES "teams"("id")
      )
    `);

    // games table — depends on seasons
    await queryRunner.query(`
      CREATE TABLE "games" (
        "id" uuid DEFAULT gen_random_uuid() NOT NULL,
        "season_id" uuid NOT NULL,
        "opponent" character varying,
        "scheduled_at" TIMESTAMP,
        CONSTRAINT "PK_games" PRIMARY KEY ("id"),
        CONSTRAINT "FK_games_season" FOREIGN KEY ("season_id") REFERENCES "seasons"("id")
      )
    `);

    // game_events table — depends on games
    await queryRunner.query(`
      CREATE TABLE "game_events" (
        "id" uuid DEFAULT gen_random_uuid() NOT NULL,
        "game_id" uuid NOT NULL,
        "event_type" character varying NOT NULL,
        "minute_occurred" integer,
        "payload" jsonb NOT NULL DEFAULT '{}',
        CONSTRAINT "PK_game_events" PRIMARY KEY ("id"),
        CONSTRAINT "FK_game_events_game" FOREIGN KEY ("game_id") REFERENCES "games"("id")
      )
    `);

    // Soccer seed (D-04): name, position types only — no field size or period type
    // ON CONFLICT DO NOTHING makes this idempotent if migration is run more than once
    await queryRunner.query(`
      INSERT INTO "sports" ("name", "position_types", "is_enabled")
      VALUES (
        'Soccer',
        '["Goalkeeper", "Defender", "Midfielder", "Forward"]'::jsonb,
        true
      )
      ON CONFLICT ("name") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop in reverse dependency order to satisfy FK constraints
    await queryRunner.query(`DROP TABLE IF EXISTS "game_events"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "games"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "seasons"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "players"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "teams"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sports"`);
  }
}
