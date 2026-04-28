import { MigrationInterface, QueryRunner } from 'typeorm';

export class TeamMemberships1777200000000 implements MigrationInterface {
  name = 'TeamMemberships1777200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create team_members table
    await queryRunner.query(`
      CREATE TABLE "team_members" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "team_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "role" character varying NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_team_members" PRIMARY KEY ("id"),
        CONSTRAINT "FK_team_members_teams" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_team_members_users" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    // 2. Add join_code column to teams
    await queryRunner.query(`
      ALTER TABLE "teams"
        ADD COLUMN "join_code" character varying UNIQUE
    `);

    // 3. Data Migration: Insert into team_members (team_id, user_id, role)
    // SELECT id, coach_id, 'HEAD_COACH' FROM teams WHERE coach_id IS NOT NULL.
    await queryRunner.query(`
      INSERT INTO "team_members" (team_id, user_id, role)
      SELECT id, coach_id, 'HEAD_COACH' FROM "teams" WHERE "coach_id" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "team_members"`);
    await queryRunner.query(`ALTER TABLE "teams" DROP COLUMN IF EXISTS "join_code"`);
  }
}
