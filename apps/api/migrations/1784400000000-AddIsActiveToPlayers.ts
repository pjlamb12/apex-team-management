import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIsActiveToPlayers1784400000000 implements MigrationInterface {
  name = 'AddIsActiveToPlayers1784400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "players" ADD "is_active" boolean NOT NULL DEFAULT true
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "players" DROP COLUMN "is_active"
    `);
  }
}
