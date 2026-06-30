import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDecidingSetScoreRules1783300000000 implements MigrationInterface {
  name = 'AddDecidingSetScoreRules1783300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "leagues" 
      ADD COLUMN "deciding_set_score_goal" integer NOT NULL DEFAULT 15,
      ADD COLUMN "deciding_set_point_cap" integer;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "leagues"
      DROP COLUMN "deciding_set_score_goal",
      DROP COLUMN "deciding_set_point_cap";
    `);
  }
}
