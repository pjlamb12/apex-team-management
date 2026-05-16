import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCandidatesAndTryouts1779000000000 implements MigrationInterface {
  name = 'CreateCandidatesAndTryouts1779000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create candidates table
    await queryRunner.query(`
      CREATE TABLE "candidates" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "first_name" character varying NOT NULL,
        "last_name" character varying NOT NULL,
        "date_of_birth" date,
        "parent_name" character varying,
        "parent_email" character varying NOT NULL,
        "parent_phone" character varying,
        "preferred_position" character varying,
        "notes" text,
        "status" character varying NOT NULL DEFAULT 'interested',
        "team_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_candidates" PRIMARY KEY ("id"),
        CONSTRAINT "FK_candidates_team" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE
      )
    `);

    // 2. Create candidate_attendance table
    await queryRunner.query(`
      CREATE TABLE "candidate_attendance" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "candidate_id" uuid NOT NULL,
        "event_id" uuid NOT NULL,
        "status" character varying NOT NULL DEFAULT 'present',
        "notes" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_candidate_attendance" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_candidate_event" UNIQUE ("candidate_id", "event_id"),
        CONSTRAINT "FK_candidate_attendance_candidate" FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_candidate_attendance_event" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE
      )
    `);

    // 3. The 'events' table 'type' column is a character varying in the entity without a DB-level enum,
    // so no explicit migration is needed for the column itself unless we want to add a check constraint.
    // For now, we'll rely on the application-level validation.
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "candidate_attendance"`);
    await queryRunner.query(`DROP TABLE "candidates"`);
  }
}
