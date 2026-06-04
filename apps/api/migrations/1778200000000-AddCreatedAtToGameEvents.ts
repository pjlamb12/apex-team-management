import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCreatedAtToGameEvents1778200000000 implements MigrationInterface {
  name = 'AddCreatedAtToGameEvents1778200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "game_events" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "game_events" DROP COLUMN "created_at"`);
  }
}
