import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPlayersOnFieldToEvents1777100000000 implements MigrationInterface {
  name = 'AddPlayersOnFieldToEvents1777100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "events"
        ADD COLUMN "players_on_field" integer
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "events"
        DROP COLUMN IF EXISTS "players_on_field"
    `);
  }
}
