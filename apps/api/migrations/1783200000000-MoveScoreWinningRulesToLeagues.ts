import { MigrationInterface, QueryRunner } from 'typeorm';

export class MoveScoreWinningRulesToLeagues1783200000000 implements MigrationInterface {
  name = 'MoveScoreWinningRulesToLeagues1783200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Drop from seasons
    await queryRunner.query(`
      ALTER TABLE "seasons" 
      DROP COLUMN IF EXISTS "best_of_sets",
      DROP COLUMN IF EXISTS "set_score_goal",
      DROP COLUMN IF EXISTS "win_by_two",
      DROP COLUMN IF EXISTS "point_cap";
    `);

    // 2. Add to leagues
    await queryRunner.query(`
      ALTER TABLE "leagues" 
      ADD COLUMN "best_of_sets" integer NOT NULL DEFAULT 5,
      ADD COLUMN "set_score_goal" integer NOT NULL DEFAULT 25,
      ADD COLUMN "win_by_two" boolean NOT NULL DEFAULT true,
      ADD COLUMN "point_cap" integer;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert leagues changes
    await queryRunner.query(`
      ALTER TABLE "leagues"
      DROP COLUMN "best_of_sets",
      DROP COLUMN "set_score_goal",
      DROP COLUMN "win_by_two",
      DROP COLUMN "point_cap";
    `);

    // Revert seasons changes
    await queryRunner.query(`
      ALTER TABLE "seasons"
      ADD COLUMN "best_of_sets" integer NOT NULL DEFAULT 5,
      ADD COLUMN "set_score_goal" integer NOT NULL DEFAULT 25,
      ADD COLUMN "win_by_two" boolean NOT NULL DEFAULT true,
      ADD COLUMN "point_cap" integer;
    `);
  }
}
