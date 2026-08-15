import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePlayerAwards1784700000000 implements MigrationInterface {
  name = 'CreatePlayerAwards1784700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "player_awards" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "team_id" uuid NOT NULL,
        "player_id" uuid NOT NULL,
        "event_id" uuid,
        "season_id" uuid,
        "badge_type" character varying NOT NULL,
        "title" character varying NOT NULL,
        "category" character varying NOT NULL,
        "icon" character varying NOT NULL,
        "color" character varying NOT NULL,
        "notes" text,
        "awarded_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_player_awards" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "player_awards"
      ADD CONSTRAINT "FK_player_awards_team"
      FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "player_awards"
      ADD CONSTRAINT "FK_player_awards_player"
      FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "player_awards"
      ADD CONSTRAINT "FK_player_awards_event"
      FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "player_awards"
      ADD CONSTRAINT "FK_player_awards_season"
      FOREIGN KEY ("season_id") REFERENCES "seasons"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_player_awards_team" ON "player_awards" ("team_id");
      CREATE INDEX "IDX_player_awards_player" ON "player_awards" ("player_id");
      CREATE INDEX "IDX_player_awards_event" ON "player_awards" ("event_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_player_awards_event"`);
    await queryRunner.query(`DROP INDEX "IDX_player_awards_player"`);
    await queryRunner.query(`DROP INDEX "IDX_player_awards_team"`);
    await queryRunner.query(`ALTER TABLE "player_awards" DROP CONSTRAINT "FK_player_awards_season"`);
    await queryRunner.query(`ALTER TABLE "player_awards" DROP CONSTRAINT "FK_player_awards_event"`);
    await queryRunner.query(`ALTER TABLE "player_awards" DROP CONSTRAINT "FK_player_awards_player"`);
    await queryRunner.query(`ALTER TABLE "player_awards" DROP CONSTRAINT "FK_player_awards_team"`);
    await queryRunner.query(`DROP TABLE "player_awards"`);
  }
}
