import { MigrationInterface, QueryRunner } from 'typeorm';

export class SupportCustomPracticeDrills1780700000000 implements MigrationInterface {
  name = 'SupportCustomPracticeDrills1780700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Make drill_id nullable
    await queryRunner.query(`
      ALTER TABLE "practice_drills" 
        ALTER COLUMN "drill_id" DROP NOT NULL
    `);

    // 2. Add custom_name column
    await queryRunner.query(`
      ALTER TABLE "practice_drills" 
        ADD COLUMN "custom_name" character varying
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. Remove custom_name column
    await queryRunner.query(`
      ALTER TABLE "practice_drills" 
        DROP COLUMN IF EXISTS "custom_name"
    `);

    // 2. Make drill_id non-nullable again
    // Note: This down migration assumes there are no null values left in drill_id.
    await queryRunner.query(`
      ALTER TABLE "practice_drills" 
        ALTER COLUMN "drill_id" SET NOT NULL
    `);
  }
}
