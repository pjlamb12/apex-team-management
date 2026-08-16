import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePlayerGoalsAndNotes1784800000000 implements MigrationInterface {
  name = 'CreatePlayerGoalsAndNotes1784800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "player_goals" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "team_id" uuid NOT NULL,
        "player_id" uuid NOT NULL,
        "season_id" uuid,
        "title" character varying NOT NULL,
        "category" character varying NOT NULL,
        "status" character varying NOT NULL DEFAULT 'in_progress',
        "mastery_stage" character varying NOT NULL DEFAULT 'emerging',
        "timeframe" character varying NOT NULL DEFAULT 'full_season',
        "target_date" date,
        "description" text,
        "baseline_assessment" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_player_goals" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "player_goal_notes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "goal_id" uuid NOT NULL,
        "team_id" uuid NOT NULL,
        "player_id" uuid NOT NULL,
        "event_id" uuid,
        "stage" character varying,
        "note" text NOT NULL,
        "observed_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_player_goal_notes" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "player_goals"
      ADD CONSTRAINT "FK_player_goals_team"
      FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "player_goals"
      ADD CONSTRAINT "FK_player_goals_player"
      FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "player_goals"
      ADD CONSTRAINT "FK_player_goals_season"
      FOREIGN KEY ("season_id") REFERENCES "seasons"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "player_goal_notes"
      ADD CONSTRAINT "FK_player_goal_notes_goal"
      FOREIGN KEY ("goal_id") REFERENCES "player_goals"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "player_goal_notes"
      ADD CONSTRAINT "FK_player_goal_notes_team"
      FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "player_goal_notes"
      ADD CONSTRAINT "FK_player_goal_notes_player"
      FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "player_goal_notes"
      ADD CONSTRAINT "FK_player_goal_notes_event"
      FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_player_goals_team" ON "player_goals" ("team_id");
      CREATE INDEX "IDX_player_goals_player" ON "player_goals" ("player_id");
      CREATE INDEX "IDX_player_goals_season" ON "player_goals" ("season_id");
      CREATE INDEX "IDX_player_goal_notes_goal" ON "player_goal_notes" ("goal_id");
      CREATE INDEX "IDX_player_goal_notes_player" ON "player_goal_notes" ("player_id");
      CREATE INDEX "IDX_player_goal_notes_event" ON "player_goal_notes" ("event_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_player_goal_notes_event"`);
    await queryRunner.query(`DROP INDEX "IDX_player_goal_notes_player"`);
    await queryRunner.query(`DROP INDEX "IDX_player_goal_notes_goal"`);
    await queryRunner.query(`DROP INDEX "IDX_player_goals_season"`);
    await queryRunner.query(`DROP INDEX "IDX_player_goals_player"`);
    await queryRunner.query(`DROP INDEX "IDX_player_goals_team"`);

    await queryRunner.query(`ALTER TABLE "player_goal_notes" DROP CONSTRAINT "FK_player_goal_notes_event"`);
    await queryRunner.query(`ALTER TABLE "player_goal_notes" DROP CONSTRAINT "FK_player_goal_notes_player"`);
    await queryRunner.query(`ALTER TABLE "player_goal_notes" DROP CONSTRAINT "FK_player_goal_notes_team"`);
    await queryRunner.query(`ALTER TABLE "player_goal_notes" DROP CONSTRAINT "FK_player_goal_notes_goal"`);

    await queryRunner.query(`ALTER TABLE "player_goals" DROP CONSTRAINT "FK_player_goals_season"`);
    await queryRunner.query(`ALTER TABLE "player_goals" DROP CONSTRAINT "FK_player_goals_player"`);
    await queryRunner.query(`ALTER TABLE "player_goals" DROP CONSTRAINT "FK_player_goals_team"`);

    await queryRunner.query(`DROP TABLE "player_goal_notes"`);
    await queryRunner.query(`DROP TABLE "player_goals"`);
  }
}
