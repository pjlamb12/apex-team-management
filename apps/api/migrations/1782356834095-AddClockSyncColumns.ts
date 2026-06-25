import { MigrationInterface, QueryRunner } from "typeorm";

export class AddClockSyncColumns1782356834095 implements MigrationInterface {
    name = 'AddClockSyncColumns1782356834095'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "locations" DROP CONSTRAINT "FK_2bf56876d5555ca0fb5a9b78656"`);
        await queryRunner.query(`ALTER TABLE "leagues" DROP CONSTRAINT "FK_leagues_season"`);
        await queryRunner.query(`ALTER TABLE "events" DROP CONSTRAINT "FK_events_league"`);
        await queryRunner.query(`ALTER TABLE "attendance" DROP CONSTRAINT "FK_attendance_event"`);
        await queryRunner.query(`ALTER TABLE "attendance" DROP CONSTRAINT "FK_attendance_player"`);
        await queryRunner.query(`ALTER TABLE "candidates" DROP CONSTRAINT "FK_candidates_team"`);
        await queryRunner.query(`ALTER TABLE "candidate_attendance" DROP CONSTRAINT "FK_candidate_attendance_candidate"`);
        await queryRunner.query(`ALTER TABLE "candidate_attendance" DROP CONSTRAINT "FK_candidate_attendance_event"`);
        await queryRunner.query(`ALTER TABLE "scouting_rubrics" DROP CONSTRAINT "FK_scouting_rubrics_team"`);
        await queryRunner.query(`ALTER TABLE "candidate_evaluations" DROP CONSTRAINT "FK_candidate_evaluations_candidate"`);
        await queryRunner.query(`ALTER TABLE "candidate_evaluations" DROP CONSTRAINT "FK_candidate_evaluations_event"`);
        await queryRunner.query(`ALTER TABLE "candidate_evaluations" DROP CONSTRAINT "FK_candidate_evaluations_rubric"`);
        await queryRunner.query(`ALTER TABLE "candidate_evaluations" DROP CONSTRAINT "FK_candidate_evaluations_coach"`);
        await queryRunner.query(`ALTER TABLE "season_players" DROP CONSTRAINT "FK_season_players_season"`);
        await queryRunner.query(`ALTER TABLE "season_players" DROP CONSTRAINT "FK_season_players_player"`);
        await queryRunner.query(`ALTER TABLE "attendance" DROP CONSTRAINT "UQ_attendance_event_player"`);
        await queryRunner.query(`ALTER TABLE "candidate_attendance" DROP CONSTRAINT "UQ_candidate_event"`);
        await queryRunner.query(`ALTER TABLE "season_players" DROP CONSTRAINT "UQ_season_player"`);
        await queryRunner.query(`ALTER TABLE "events" ADD "clock_start_time" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "events" ADD "clock_accumulated_ms" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "attendance" ADD CONSTRAINT "UQ_176bc8898b4e2f2c7645081a1c9" UNIQUE ("event_id", "player_id")`);
        await queryRunner.query(`ALTER TABLE "locations" ADD CONSTRAINT "FK_2bf56876d5555ca0fb5a9b78656" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "leagues" ADD CONSTRAINT "FK_e3c0a0a89e12edf711b11a9617e" FOREIGN KEY ("season_id") REFERENCES "seasons"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "events" ADD CONSTRAINT "FK_29499cbd71949f17bece8d2f4e2" FOREIGN KEY ("league_id") REFERENCES "leagues"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "attendance" ADD CONSTRAINT "FK_7d7311cda422c942133ec077ed8" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "attendance" ADD CONSTRAINT "FK_fb45b9a66d0f8de6feb04f0bdf4" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "candidates" ADD CONSTRAINT "FK_e34ff9661297dc1a7a462d7c34f" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "candidate_attendance" ADD CONSTRAINT "FK_d5e0896555849e9886406619539" FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "candidate_attendance" ADD CONSTRAINT "FK_9b1f9f789094c953b90b2160943" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "scouting_rubrics" ADD CONSTRAINT "FK_99d69e8a3dfa59c2344554adf12" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "candidate_evaluations" ADD CONSTRAINT "FK_b8699be269956f1156ae6286636" FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "candidate_evaluations" ADD CONSTRAINT "FK_d74173617e73c1ba0e9d2139b13" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "candidate_evaluations" ADD CONSTRAINT "FK_3fb88d7ca945eb4e2b432a767fa" FOREIGN KEY ("rubric_id") REFERENCES "scouting_rubrics"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "candidate_evaluations" ADD CONSTRAINT "FK_2a13c005442d341dc00831a8e8e" FOREIGN KEY ("coach_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "season_players" ADD CONSTRAINT "FK_2d3724685ac5af81d4ed510a51e" FOREIGN KEY ("season_id") REFERENCES "seasons"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "season_players" ADD CONSTRAINT "FK_03f8cc23e9a92f87e86d8bdcdda" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "season_players" DROP CONSTRAINT "FK_03f8cc23e9a92f87e86d8bdcdda"`);
        await queryRunner.query(`ALTER TABLE "season_players" DROP CONSTRAINT "FK_2d3724685ac5af81d4ed510a51e"`);
        await queryRunner.query(`ALTER TABLE "candidate_evaluations" DROP CONSTRAINT "FK_2a13c005442d341dc00831a8e8e"`);
        await queryRunner.query(`ALTER TABLE "candidate_evaluations" DROP CONSTRAINT "FK_3fb88d7ca945eb4e2b432a767fa"`);
        await queryRunner.query(`ALTER TABLE "candidate_evaluations" DROP CONSTRAINT "FK_d74173617e73c1ba0e9d2139b13"`);
        await queryRunner.query(`ALTER TABLE "candidate_evaluations" DROP CONSTRAINT "FK_b8699be269956f1156ae6286636"`);
        await queryRunner.query(`ALTER TABLE "scouting_rubrics" DROP CONSTRAINT "FK_99d69e8a3dfa59c2344554adf12"`);
        await queryRunner.query(`ALTER TABLE "candidate_attendance" DROP CONSTRAINT "FK_9b1f9f789094c953b90b2160943"`);
        await queryRunner.query(`ALTER TABLE "candidate_attendance" DROP CONSTRAINT "FK_d5e0896555849e9886406619539"`);
        await queryRunner.query(`ALTER TABLE "candidates" DROP CONSTRAINT "FK_e34ff9661297dc1a7a462d7c34f"`);
        await queryRunner.query(`ALTER TABLE "attendance" DROP CONSTRAINT "FK_fb45b9a66d0f8de6feb04f0bdf4"`);
        await queryRunner.query(`ALTER TABLE "attendance" DROP CONSTRAINT "FK_7d7311cda422c942133ec077ed8"`);
        await queryRunner.query(`ALTER TABLE "events" DROP CONSTRAINT "FK_29499cbd71949f17bece8d2f4e2"`);
        await queryRunner.query(`ALTER TABLE "leagues" DROP CONSTRAINT "FK_e3c0a0a89e12edf711b11a9617e"`);
        await queryRunner.query(`ALTER TABLE "locations" DROP CONSTRAINT "FK_2bf56876d5555ca0fb5a9b78656"`);
        await queryRunner.query(`ALTER TABLE "attendance" DROP CONSTRAINT "UQ_176bc8898b4e2f2c7645081a1c9"`);
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "clock_accumulated_ms"`);
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "clock_start_time"`);
        await queryRunner.query(`ALTER TABLE "season_players" ADD CONSTRAINT "UQ_season_player" UNIQUE ("season_id", "player_id")`);
        await queryRunner.query(`ALTER TABLE "candidate_attendance" ADD CONSTRAINT "UQ_candidate_event" UNIQUE ("candidate_id", "event_id")`);
        await queryRunner.query(`ALTER TABLE "attendance" ADD CONSTRAINT "UQ_attendance_event_player" UNIQUE ("event_id", "player_id")`);
        await queryRunner.query(`ALTER TABLE "season_players" ADD CONSTRAINT "FK_season_players_player" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "season_players" ADD CONSTRAINT "FK_season_players_season" FOREIGN KEY ("season_id") REFERENCES "seasons"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "candidate_evaluations" ADD CONSTRAINT "FK_candidate_evaluations_coach" FOREIGN KEY ("coach_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "candidate_evaluations" ADD CONSTRAINT "FK_candidate_evaluations_rubric" FOREIGN KEY ("rubric_id") REFERENCES "scouting_rubrics"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "candidate_evaluations" ADD CONSTRAINT "FK_candidate_evaluations_event" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "candidate_evaluations" ADD CONSTRAINT "FK_candidate_evaluations_candidate" FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "scouting_rubrics" ADD CONSTRAINT "FK_scouting_rubrics_team" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "candidate_attendance" ADD CONSTRAINT "FK_candidate_attendance_event" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "candidate_attendance" ADD CONSTRAINT "FK_candidate_attendance_candidate" FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "candidates" ADD CONSTRAINT "FK_candidates_team" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "attendance" ADD CONSTRAINT "FK_attendance_player" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "attendance" ADD CONSTRAINT "FK_attendance_event" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "events" ADD CONSTRAINT "FK_events_league" FOREIGN KEY ("league_id") REFERENCES "leagues"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "leagues" ADD CONSTRAINT "FK_leagues_season" FOREIGN KEY ("season_id") REFERENCES "seasons"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "locations" ADD CONSTRAINT "FK_2bf56876d5555ca0fb5a9b78656" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
