import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSchedulingAndWeather1777704365283 implements MigrationInterface {
    name = 'AddSchedulingAndWeather1777704365283'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "events" DROP CONSTRAINT IF EXISTS "FK_events_parent_event"`);
        await queryRunner.query(`ALTER TABLE "team_members" DROP CONSTRAINT "FK_team_members_teams"`);
        await queryRunner.query(`ALTER TABLE "team_members" DROP CONSTRAINT "FK_team_members_users"`);
        await queryRunner.query(`CREATE TABLE "locations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "address" character varying, "city" character varying, "state" character varying, "zip_code" character varying, "lat" numeric(10,7), "lon" numeric(10,7), CONSTRAINT "PK_7cc1c9e3853b94816c094825e74" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "teams" DROP COLUMN "location"`);
        await queryRunner.query(`ALTER TABLE "teams" DROP COLUMN "zip_code"`);
        await queryRunner.query(`ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "recurrence_rule" text`);
        await queryRunner.query(`ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "parent_event_id" uuid`);
        await queryRunner.query(`ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "weather_data" jsonb`);
        await queryRunner.query(`ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "weather_last_updated" timestamp`);
        await queryRunner.query(`ALTER TABLE "events" ADD "location_id" uuid`);
        await queryRunner.query(`ALTER TABLE "teams" ADD "home_location_id" uuid`);
        await queryRunner.query(`ALTER TABLE "team_members" DROP COLUMN "role"`);
        await queryRunner.query(`CREATE TYPE "public"."team_members_role_enum" AS ENUM('HEAD_COACH', 'ASSISTANT')`);
        await queryRunner.query(`ALTER TABLE "team_members" ADD "role" "public"."team_members_role_enum" NOT NULL DEFAULT 'ASSISTANT'`);
        await queryRunner.query(`ALTER TABLE "events" ADD CONSTRAINT "FK_fccf31c64ec14a66276e9999730" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "events" ADD CONSTRAINT "FK_9c382387efd98e6134aa13b453c" FOREIGN KEY ("parent_event_id") REFERENCES "events"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "team_members" ADD CONSTRAINT "FK_fdad7d5768277e60c40e01cdcea" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "team_members" ADD CONSTRAINT "FK_c2bf4967c8c2a6b845dadfbf3d4" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "teams" ADD CONSTRAINT "FK_b251507dad14ef326a57a9d9f19" FOREIGN KEY ("home_location_id") REFERENCES "locations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "teams" DROP CONSTRAINT "FK_b251507dad14ef326a57a9d9f19"`);
        await queryRunner.query(`ALTER TABLE "team_members" DROP CONSTRAINT "FK_c2bf4967c8c2a6b845dadfbf3d4"`);
        await queryRunner.query(`ALTER TABLE "team_members" DROP CONSTRAINT "FK_fdad7d5768277e60c40e01cdcea"`);
        await queryRunner.query(`ALTER TABLE "events" DROP CONSTRAINT "FK_9c382387efd98e6134aa13b453c"`);
        await queryRunner.query(`ALTER TABLE "events" DROP CONSTRAINT "FK_fccf31c64ec14a66276e9999730"`);
        await queryRunner.query(`ALTER TABLE "team_members" DROP COLUMN "role"`);
        await queryRunner.query(`DROP TYPE "public"."team_members_role_enum"`);
        await queryRunner.query(`ALTER TABLE "team_members" ADD "role" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "teams" DROP COLUMN "home_location_id"`);
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "location_id"`);
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN IF EXISTS "weather_last_updated"`);
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN IF EXISTS "weather_data"`);
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN IF EXISTS "parent_event_id"`);
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN IF EXISTS "recurrence_rule"`);
        await queryRunner.query(`ALTER TABLE "teams" ADD "zip_code" character varying`);
        await queryRunner.query(`ALTER TABLE "teams" ADD "location" character varying`);
        await queryRunner.query(`DROP TABLE "locations"`);
        await queryRunner.query(`ALTER TABLE "team_members" ADD CONSTRAINT "FK_team_members_users" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "team_members" ADD CONSTRAINT "FK_team_members_teams" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "events" ADD CONSTRAINT "FK_events_parent_event" FOREIGN KEY ("parent_event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
