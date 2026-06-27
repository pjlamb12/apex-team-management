import { MigrationInterface, QueryRunner } from "typeorm";

export class MoveHomeLocationToSeasons1782700000000 implements MigrationInterface {
    name = 'MoveHomeLocationToSeasons1782700000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Add home_location_id column to seasons
        await queryRunner.query(`ALTER TABLE "seasons" ADD "home_location_id" uuid`);

        // 2. Migrate existing values from teams to seasons
        await queryRunner.query(`
            UPDATE "seasons" s
            SET "home_location_id" = t."home_location_id"
            FROM "teams" t
            WHERE s."team_id" = t."id" AND t."home_location_id" IS NOT NULL
        `);

        // 3. Add foreign key constraint to seasons
        await queryRunner.query(`ALTER TABLE "seasons" ADD CONSTRAINT "FK_seasons_home_location" FOREIGN KEY ("home_location_id") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);

        // 4. Drop constraint and column from teams
        await queryRunner.query(`ALTER TABLE "teams" DROP CONSTRAINT IF EXISTS "FK_b251507dad14ef326a57a9d9f19"`);
        await queryRunner.query(`ALTER TABLE "teams" DROP COLUMN IF EXISTS "home_location_id"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // 1. Restore column and constraint on teams
        await queryRunner.query(`ALTER TABLE "teams" ADD "home_location_id" uuid`);
        await queryRunner.query(`ALTER TABLE "teams" ADD CONSTRAINT "FK_b251507dad14ef326a57a9d9f19" FOREIGN KEY ("home_location_id") REFERENCES "locations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);

        // 2. Migrate back from seasons to teams
        await queryRunner.query(`
            UPDATE "teams" t
            SET "home_location_id" = s."home_location_id"
            FROM "seasons" s
            WHERE s."team_id" = t."id" AND s."home_location_id" IS NOT NULL
        `);

        // 3. Drop constraint and column from seasons
        await queryRunner.query(`ALTER TABLE "seasons" DROP CONSTRAINT "FK_seasons_home_location"`);
        await queryRunner.query(`ALTER TABLE "seasons" DROP COLUMN "home_location_id"`);
    }
}
