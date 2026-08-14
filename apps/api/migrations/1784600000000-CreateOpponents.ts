import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOpponents1784600000000 implements MigrationInterface {
  name = 'CreateOpponents1784600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create opponents table
    await queryRunner.query(`
      CREATE TABLE "opponents" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "team_id" uuid NOT NULL,
        "name" character varying NOT NULL,
        "coach_name" character varying,
        "contact_info" character varying,
        "primary_color" character varying,
        "secondary_color" character varying,
        "formation" character varying,
        "threat_level" character varying DEFAULT 'medium',
        "notes" text,
        "tendencies" text,
        "danger_players" jsonb DEFAULT '[]',
        "scouting_notes" jsonb DEFAULT '[]',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_opponents" PRIMARY KEY ("id")
      )
    `);

    // 2. Add foreign key constraint to teams
    await queryRunner.query(`
      ALTER TABLE "opponents"
      ADD CONSTRAINT "FK_opponents_team"
      FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    // 3. Add opponent_id column to events table
    await queryRunner.query(`
      ALTER TABLE "events"
      ADD COLUMN "opponent_id" uuid
    `);

    await queryRunner.query(`
      ALTER TABLE "events"
      ADD CONSTRAINT "FK_events_opponent"
      FOREIGN KEY ("opponent_id") REFERENCES "opponents"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    // 4. Backfill existing opponents from past events
    await queryRunner.query(`
      DO $$
      DECLARE
        rec RECORD;
        new_opp_id uuid;
      BEGIN
        FOR rec IN 
          SELECT DISTINCT TRIM(e.opponent) as opp_name, s.team_id 
          FROM events e 
          JOIN seasons s ON s.id = e.season_id 
          WHERE e.opponent IS NOT NULL AND TRIM(e.opponent) <> ''
        LOOP
          INSERT INTO opponents (team_id, name, created_at, updated_at)
          VALUES (rec.team_id, rec.opp_name, now(), now())
          RETURNING id INTO new_opp_id;

          UPDATE events e
          SET opponent_id = new_opp_id
          FROM seasons s
          WHERE e.season_id = s.id 
            AND s.team_id = rec.team_id 
            AND TRIM(e.opponent) = rec.opp_name
            AND e.opponent_id IS NULL;
        END LOOP;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "events" DROP CONSTRAINT "FK_events_opponent"`);
    await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "opponent_id"`);
    await queryRunner.query(`ALTER TABLE "opponents" DROP CONSTRAINT "FK_opponents_team"`);
    await queryRunner.query(`DROP TABLE "opponents"`);
  }
}
