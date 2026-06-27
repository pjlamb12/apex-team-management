import { MigrationInterface, QueryRunner } from "typeorm";

export class MoveDefaultsToCompetitions1782800000000 implements MigrationInterface {
    name = 'MoveDefaultsToCompetitions1782800000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Add columns to leagues table
        await queryRunner.query(`ALTER TABLE "leagues" ADD "players_on_field" integer`);
        await queryRunner.query(`ALTER TABLE "leagues" ADD "period_count" integer`);
        await queryRunner.query(`ALTER TABLE "leagues" ADD "period_length_minutes" integer`);
        await queryRunner.query(`ALTER TABLE "leagues" ADD "default_home_venue" character varying`);
        await queryRunner.query(`ALTER TABLE "leagues" ADD "default_home_color" character varying`);
        await queryRunner.query(`ALTER TABLE "leagues" ADD "default_away_color" character varying`);
        await queryRunner.query(`ALTER TABLE "leagues" ADD "home_location_id" uuid`);

        // 2. Add foreign key to locations on leagues table
        await queryRunner.query(`ALTER TABLE "leagues" ADD CONSTRAINT "FK_leagues_home_location" FOREIGN KEY ("home_location_id") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);

        // 3. Migrate data from seasons to leagues
        await queryRunner.query(`
            UPDATE "leagues" l
            SET
                "players_on_field" = s."players_on_field",
                "period_count" = s."period_count",
                "period_length_minutes" = s."period_length_minutes",
                "default_home_venue" = s."default_home_venue",
                "default_home_color" = s."default_home_color",
                "default_away_color" = s."default_away_color",
                "home_location_id" = s."home_location_id"
            FROM "seasons" s
            WHERE l."season_id" = s."id"
        `);

        // 4. Drop columns and foreign key from seasons table
        await queryRunner.query(`ALTER TABLE "seasons" DROP CONSTRAINT IF EXISTS "FK_seasons_home_location"`);
        await queryRunner.query(`ALTER TABLE "seasons" DROP COLUMN IF EXISTS "players_on_field"`);
        await queryRunner.query(`ALTER TABLE "seasons" DROP COLUMN IF EXISTS "period_count"`);
        await queryRunner.query(`ALTER TABLE "seasons" DROP COLUMN IF EXISTS "period_length_minutes"`);
        await queryRunner.query(`ALTER TABLE "seasons" DROP COLUMN IF EXISTS "default_home_venue"`);
        await queryRunner.query(`ALTER TABLE "seasons" DROP COLUMN IF EXISTS "default_home_color"`);
        await queryRunner.query(`ALTER TABLE "seasons" DROP COLUMN IF EXISTS "default_away_color"`);
        await queryRunner.query(`ALTER TABLE "seasons" DROP COLUMN IF EXISTS "home_location_id"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // 1. Add columns back to seasons table
        await queryRunner.query(`ALTER TABLE "seasons" ADD "players_on_field" integer`);
        await queryRunner.query(`ALTER TABLE "seasons" ADD "period_count" integer`);
        await queryRunner.query(`ALTER TABLE "seasons" ADD "period_length_minutes" integer`);
        await queryRunner.query(`ALTER TABLE "seasons" ADD "default_home_venue" character varying`);
        await queryRunner.query(`ALTER TABLE "seasons" ADD "default_home_color" character varying`);
        await queryRunner.query(`ALTER TABLE "seasons" ADD "default_away_color" character varying`);
        await queryRunner.query(`ALTER TABLE "seasons" ADD "home_location_id" uuid`);

        // 2. Add foreign key back to seasons table
        await queryRunner.query(`ALTER TABLE "seasons" ADD CONSTRAINT "FK_seasons_home_location" FOREIGN KEY ("home_location_id") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);

        // 3. Migrate data back from leagues to seasons
        await queryRunner.query(`
            UPDATE "seasons" s
            SET
                "players_on_field" = l."players_on_field",
                "period_count" = l."period_count",
                "period_length_minutes" = l."period_length_minutes",
                "default_home_venue" = l."default_home_venue",
                "default_home_color" = l."default_home_color",
                "default_away_color" = l."default_away_color",
                "home_location_id" = l."home_location_id"
            FROM "leagues" l
            WHERE l."season_id" = s."id" AND s."is_active" = true
        `);

        // 4. Drop columns and foreign key from leagues table
        await queryRunner.query(`ALTER TABLE "leagues" DROP CONSTRAINT IF EXISTS "FK_leagues_home_location"`);
        await queryRunner.query(`ALTER TABLE "leagues" DROP COLUMN IF EXISTS "players_on_field"`);
        await queryRunner.query(`ALTER TABLE "leagues" DROP COLUMN IF EXISTS "period_count"`);
        await queryRunner.query(`ALTER TABLE "leagues" DROP COLUMN IF EXISTS "period_length_minutes"`);
        await queryRunner.query(`ALTER TABLE "leagues" DROP COLUMN IF EXISTS "default_home_venue"`);
        await queryRunner.query(`ALTER TABLE "leagues" DROP COLUMN IF EXISTS "default_home_color"`);
        await queryRunner.query(`ALTER TABLE "leagues" DROP COLUMN IF EXISTS "default_away_color"`);
        await queryRunner.query(`ALTER TABLE "leagues" DROP COLUMN IF EXISTS "home_location_id"`);
    }
}
