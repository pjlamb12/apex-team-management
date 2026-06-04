import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePracticeDrills1776925799677 implements MigrationInterface {
    name = 'CreatePracticeDrills1776925799677'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tags" DROP CONSTRAINT "FK_tags_coach"`);
        await queryRunner.query(`ALTER TABLE "drills" DROP CONSTRAINT "FK_drills_coach"`);
        await queryRunner.query(`ALTER TABLE "events" DROP CONSTRAINT "FK_c02edffc051ed57ca323851d691"`);
        await queryRunner.query(`ALTER TABLE "game_events" DROP CONSTRAINT "FK_5e9c9173e6d21d06023146b42e3"`);
        await queryRunner.query(`ALTER TABLE "lineup_entries" DROP CONSTRAINT "FK_e4d7506842644d3e54ebe30bd91"`);
        await queryRunner.query(`ALTER TABLE "drill_tags" DROP CONSTRAINT "FK_drill_tags_drill"`);
        await queryRunner.query(`ALTER TABLE "drill_tags" DROP CONSTRAINT "FK_drill_tags_tag"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_tags_coach"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_drills_coach"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_drills_instructions"`);
        await queryRunner.query(`ALTER TABLE "tags" DROP CONSTRAINT "UQ_tags_coach_name"`);
        await queryRunner.query(`CREATE TABLE "practice_drills" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "event_id" uuid NOT NULL, "drill_id" uuid NOT NULL, "sequence" integer NOT NULL, "duration_minutes" integer NOT NULL DEFAULT '0', "team_rating" integer, "notes" text, CONSTRAINT "PK_cc6eb578bfccad04e75ff02f29c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_a13f3cb26ba8251f58eed90324" ON "practice_drills" ("event_id", "sequence") `);
        await queryRunner.query(`CREATE INDEX "IDX_b37edd2117f58cec7ef28084ba" ON "tags" ("coach_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_3db0d846967b2f2abb44543fbe" ON "drills" ("coach_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_c8b4147df9bb09c3d14ecfaab7" ON "drill_tags" ("drill_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_5260c8fb5edfd41a01b5a9bb3b" ON "drill_tags" ("tag_id") `);
        await queryRunner.query(`ALTER TABLE "tags" ADD CONSTRAINT "UQ_f8584c95828ec84df459c3a2000" UNIQUE ("coach_id", "name")`);
        await queryRunner.query(`ALTER TABLE "tags" ADD CONSTRAINT "FK_b37edd2117f58cec7ef28084ba1" FOREIGN KEY ("coach_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "drills" ADD CONSTRAINT "FK_3db0d846967b2f2abb44543fbec" FOREIGN KEY ("coach_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "practice_drills" ADD CONSTRAINT "FK_e501405f50038c42c298457085d" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "practice_drills" ADD CONSTRAINT "FK_5fb9db7cb3279d9d39f7c7437d6" FOREIGN KEY ("drill_id") REFERENCES "drills"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "events" ADD CONSTRAINT "FK_015b33819d8f4e702bafb77b796" FOREIGN KEY ("season_id") REFERENCES "seasons"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "game_events" ADD CONSTRAINT "FK_52392db00c94801e9de4eaa5e7b" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "lineup_entries" ADD CONSTRAINT "FK_7eaaae3fad5bea74ef4b481a973" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "drill_tags" ADD CONSTRAINT "FK_c8b4147df9bb09c3d14ecfaab75" FOREIGN KEY ("drill_id") REFERENCES "drills"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "drill_tags" ADD CONSTRAINT "FK_5260c8fb5edfd41a01b5a9bb3bd" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "drill_tags" DROP CONSTRAINT "FK_5260c8fb5edfd41a01b5a9bb3bd"`);
        await queryRunner.query(`ALTER TABLE "drill_tags" DROP CONSTRAINT "FK_c8b4147df9bb09c3d14ecfaab75"`);
        await queryRunner.query(`ALTER TABLE "lineup_entries" DROP CONSTRAINT "FK_7eaaae3fad5bea74ef4b481a973"`);
        await queryRunner.query(`ALTER TABLE "game_events" DROP CONSTRAINT "FK_52392db00c94801e9de4eaa5e7b"`);
        await queryRunner.query(`ALTER TABLE "events" DROP CONSTRAINT "FK_015b33819d8f4e702bafb77b796"`);
        await queryRunner.query(`ALTER TABLE "practice_drills" DROP CONSTRAINT "FK_5fb9db7cb3279d9d39f7c7437d6"`);
        await queryRunner.query(`ALTER TABLE "practice_drills" DROP CONSTRAINT "FK_e501405f50038c42c298457085d"`);
        await queryRunner.query(`ALTER TABLE "drills" DROP CONSTRAINT "FK_3db0d846967b2f2abb44543fbec"`);
        await queryRunner.query(`ALTER TABLE "tags" DROP CONSTRAINT "FK_b37edd2117f58cec7ef28084ba1"`);
        await queryRunner.query(`ALTER TABLE "tags" DROP CONSTRAINT "UQ_f8584c95828ec84df459c3a2000"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5260c8fb5edfd41a01b5a9bb3b"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c8b4147df9bb09c3d14ecfaab7"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3db0d846967b2f2abb44543fbe"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b37edd2117f58cec7ef28084ba"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a13f3cb26ba8251f58eed90324"`);
        await queryRunner.query(`DROP TABLE "practice_drills"`);
        await queryRunner.query(`ALTER TABLE "tags" ADD CONSTRAINT "UQ_tags_coach_name" UNIQUE ("coach_id", "name")`);
        await queryRunner.query(`CREATE INDEX "IDX_drills_instructions" ON "drills" ("instructions") `);
        await queryRunner.query(`CREATE INDEX "IDX_drills_coach" ON "drills" ("coach_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_tags_coach" ON "tags" ("coach_id") `);
        await queryRunner.query(`ALTER TABLE "drill_tags" ADD CONSTRAINT "FK_drill_tags_tag" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "drill_tags" ADD CONSTRAINT "FK_drill_tags_drill" FOREIGN KEY ("drill_id") REFERENCES "drills"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "lineup_entries" ADD CONSTRAINT "FK_e4d7506842644d3e54ebe30bd91" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "game_events" ADD CONSTRAINT "FK_5e9c9173e6d21d06023146b42e3" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "events" ADD CONSTRAINT "FK_c02edffc051ed57ca323851d691" FOREIGN KEY ("season_id") REFERENCES "seasons"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "drills" ADD CONSTRAINT "FK_drills_coach" FOREIGN KEY ("coach_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tags" ADD CONSTRAINT "FK_tags_coach" FOREIGN KEY ("coach_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
