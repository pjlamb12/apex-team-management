import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateScoutingAndEvaluations1779100000000 implements MigrationInterface {
  name = 'CreateScoutingAndEvaluations1779100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create scouting_rubrics table
    await queryRunner.query(`
      CREATE TABLE "scouting_rubrics" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "team_id" uuid NOT NULL,
        "name" character varying NOT NULL,
        "description" text,
        "weight" integer NOT NULL DEFAULT 1,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_scouting_rubrics" PRIMARY KEY ("id"),
        CONSTRAINT "FK_scouting_rubrics_team" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE
      )
    `);

    // 2. Create candidate_evaluations table
    await queryRunner.query(`
      CREATE TABLE "candidate_evaluations" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "candidate_id" uuid NOT NULL,
        "event_id" uuid,
        "rubric_id" uuid NOT NULL,
        "coach_id" uuid NOT NULL,
        "rating" integer NOT NULL,
        "notes" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_candidate_evaluations" PRIMARY KEY ("id"),
        CONSTRAINT "FK_candidate_evaluations_candidate" FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_candidate_evaluations_event" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_candidate_evaluations_rubric" FOREIGN KEY ("rubric_id") REFERENCES "scouting_rubrics"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_candidate_evaluations_coach" FOREIGN KEY ("coach_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "candidate_evaluations"`);
    await queryRunner.query(`DROP TABLE "scouting_rubrics"`);
  }
}
