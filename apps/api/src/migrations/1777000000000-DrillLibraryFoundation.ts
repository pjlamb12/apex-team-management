import { MigrationInterface, QueryRunner } from 'typeorm';

export class DrillLibraryFoundation1777000000000 implements MigrationInterface {
  name = 'DrillLibraryFoundation1777000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "tags" (
        "id" uuid DEFAULT gen_random_uuid() NOT NULL,
        "coach_id" uuid NOT NULL,
        "name" character varying NOT NULL,
        CONSTRAINT "PK_tags" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_tags_coach_name" UNIQUE ("coach_id", "name"),
        CONSTRAINT "FK_tags_coach" FOREIGN KEY ("coach_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "drills" (
        "id" uuid DEFAULT gen_random_uuid() NOT NULL,
        "coach_id" uuid NOT NULL,
        "name" character varying NOT NULL,
        "description" text NOT NULL,
        "source_url" character varying,
        "instructions" jsonb NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_drills" PRIMARY KEY ("id"),
        CONSTRAINT "FK_drills_coach" FOREIGN KEY ("coach_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "drill_tags" (
        "drill_id" uuid NOT NULL,
        "tag_id" uuid NOT NULL,
        CONSTRAINT "PK_drill_tags" PRIMARY KEY ("drill_id", "tag_id"),
        CONSTRAINT "FK_drill_tags_drill" FOREIGN KEY ("drill_id") REFERENCES "drills"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_drill_tags_tag" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_drills_coach" ON "drills" ("coach_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_tags_coach" ON "tags" ("coach_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_drills_instructions" ON "drills" USING GIN ("instructions")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_drills_instructions"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_tags_coach"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_drills_coach"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "drill_tags"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "drills"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "tags"`);
  }
}
