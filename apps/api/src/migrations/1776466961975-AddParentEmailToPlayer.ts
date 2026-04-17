import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddParentEmailToPlayer1776466961975 implements MigrationInterface {
  name = 'AddParentEmailToPlayer1776466961975';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "players"
        ADD COLUMN IF NOT EXISTS "parent_email" character varying
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "players"
        DROP COLUMN IF EXISTS "parent_email"
    `);
  }
}
