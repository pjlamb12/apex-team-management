import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddScoreWinningRulesToSeason1783100000000 implements MigrationInterface {
  name = 'AddScoreWinningRulesToSeason1783100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "seasons" 
      ADD COLUMN "best_of_sets" integer NOT NULL DEFAULT 5,
      ADD COLUMN "set_score_goal" integer NOT NULL DEFAULT 25,
      ADD COLUMN "win_by_two" boolean NOT NULL DEFAULT true,
      ADD COLUMN "point_cap" integer;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "seasons"
      DROP COLUMN "best_of_sets",
      DROP COLUMN "set_score_goal",
      DROP COLUMN "win_by_two",
      DROP COLUMN "point_cap";
    `);
  }
}
