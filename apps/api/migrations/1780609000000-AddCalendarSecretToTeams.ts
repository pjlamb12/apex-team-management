import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCalendarSecretToTeams1780609000000 implements MigrationInterface {
  name = 'AddCalendarSecretToTeams1780609000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "teams"
        ADD COLUMN IF NOT EXISTS "calendar_secret" character varying UNIQUE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "teams"
        DROP COLUMN IF EXISTS "calendar_secret"
    `);
  }
}
