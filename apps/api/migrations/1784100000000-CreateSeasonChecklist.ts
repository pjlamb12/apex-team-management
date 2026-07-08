import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSeasonChecklist1784100000000 implements MigrationInterface {
  name = 'CreateSeasonChecklist1784100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create season_checklist_items table
    await queryRunner.query(`
      CREATE TABLE "season_checklist_items" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "season_id" uuid NOT NULL,
        "name" character varying NOT NULL,
        "sort_order" integer NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_season_checklist_items" PRIMARY KEY ("id")
      )
    `);

    // 2. Create season_checklist_values table
    await queryRunner.query(`
      CREATE TABLE "season_checklist_values" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "player_id" uuid NOT NULL,
        "item_id" uuid NOT NULL,
        "value" character varying,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_season_checklist_values" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_season_checklist_values_player_item" UNIQUE ("player_id", "item_id")
      )
    `);

    // 3. Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "season_checklist_items"
      ADD CONSTRAINT "FK_season_checklist_items_season"
      FOREIGN KEY ("season_id") REFERENCES "seasons"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "season_checklist_values"
      ADD CONSTRAINT "FK_season_checklist_values_player"
      FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "season_checklist_values"
      ADD CONSTRAINT "FK_season_checklist_values_item"
      FOREIGN KEY ("item_id") REFERENCES "season_checklist_items"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys first
    await queryRunner.query(`ALTER TABLE "season_checklist_values" DROP CONSTRAINT "FK_season_checklist_values_item"`);
    await queryRunner.query(`ALTER TABLE "season_checklist_values" DROP CONSTRAINT "FK_season_checklist_values_player"`);
    await queryRunner.query(`ALTER TABLE "season_checklist_items" DROP CONSTRAINT "FK_season_checklist_items_season"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE "season_checklist_values"`);
    await queryRunner.query(`DROP TABLE "season_checklist_items"`);
  }
}
