import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddScoreToEvents1776800000000 implements MigrationInterface {
  name = 'AddScoreToEvents1776800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "events" ADD "goals_for" integer`);
    await queryRunner.query(`ALTER TABLE "events" ADD "goals_against" integer`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "goals_against"`);
    await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "goals_for"`);
  }
}
