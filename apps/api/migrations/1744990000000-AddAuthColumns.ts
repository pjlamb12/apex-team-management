import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAuthColumns1744990000000 implements MigrationInterface {
  name = 'AddAuthColumns1744990000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Two-step NOT NULL column addition: add with DEFAULT '' first,
    // then DROP DEFAULT so existing rows get the placeholder value
    // and new rows must supply a real hash. (RESEARCH.md migration pitfall)
    await queryRunner.query(`
      ALTER TABLE "users"
        ADD COLUMN "password_hash" character varying NOT NULL DEFAULT '',
        ADD COLUMN "password_reset_token" character varying,
        ADD COLUMN "password_reset_expiry" TIMESTAMP
    `);
    await queryRunner.query(`
      ALTER TABLE "users" ALTER COLUMN "password_hash" DROP DEFAULT
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
        DROP COLUMN IF EXISTS "password_hash",
        DROP COLUMN IF EXISTS "password_reset_token",
        DROP COLUMN IF EXISTS "password_reset_expiry"
    `);
  }
}
