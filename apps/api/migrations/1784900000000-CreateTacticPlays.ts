import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTacticPlays1784900000000 implements MigrationInterface {
  name = 'CreateTacticPlays1784900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "tactic_plays" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "coach_id" uuid NOT NULL,
        "title" character varying NOT NULL,
        "description" text,
        "sport" character varying NOT NULL,
        "category" character varying NOT NULL DEFAULT 'formation',
        "pitch_type" character varying NOT NULL DEFAULT 'full_pitch',
        "tags" text[] NOT NULL DEFAULT '{}',
        "canvas_data" jsonb NOT NULL,
        "notes" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_tactic_plays" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "tactic_plays"
      ADD CONSTRAINT "FK_tactic_plays_coach"
      FOREIGN KEY ("coach_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_tactic_plays_coach" ON "tactic_plays" ("coach_id");
      CREATE INDEX "IDX_tactic_plays_sport" ON "tactic_plays" ("sport");
      CREATE INDEX "IDX_tactic_plays_category" ON "tactic_plays" ("category");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_tactic_plays_category"`);
    await queryRunner.query(`DROP INDEX "IDX_tactic_plays_sport"`);
    await queryRunner.query(`DROP INDEX "IDX_tactic_plays_coach"`);
    await queryRunner.query(`ALTER TABLE "tactic_plays" DROP CONSTRAINT "FK_tactic_plays_coach"`);
    await queryRunner.query(`DROP TABLE "tactic_plays"`);
  }
}
