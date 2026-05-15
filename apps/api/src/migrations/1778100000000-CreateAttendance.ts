import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAttendance1778100000000 implements MigrationInterface {
  name = 'CreateAttendance1778100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "attendance" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "event_id" uuid NOT NULL,
        "player_id" uuid NOT NULL,
        "status" character varying NOT NULL DEFAULT 'absent',
        "notes" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_attendance" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_attendance_event_player" UNIQUE ("event_id", "player_id"),
        CONSTRAINT "FK_attendance_event" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_attendance_player" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "attendance"`);
  }
}
