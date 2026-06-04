import { MigrationInterface, QueryRunner } from "typeorm";

export class SeasonDefaultsAndSlots1776664695002 implements MigrationInterface {
    name = 'SeasonDefaultsAndSlots1776664695002'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "seasons" DROP CONSTRAINT "FK_seasons_team"`);
        await queryRunner.query(`ALTER TABLE "teams" DROP CONSTRAINT "FK_teams_sport"`);
        await queryRunner.query(`ALTER TABLE "teams" DROP CONSTRAINT "FK_teams_coach"`);
        await queryRunner.query(`ALTER TABLE "players" DROP CONSTRAINT "FK_players_team"`);
        await queryRunner.query(`ALTER TABLE "games" DROP CONSTRAINT "FK_games_season"`);
        await queryRunner.query(`ALTER TABLE "game_events" DROP CONSTRAINT "FK_game_events_game"`);
        await queryRunner.query(`ALTER TABLE "lineup_entries" DROP CONSTRAINT "FK_lineup_entries_game"`);
        await queryRunner.query(`ALTER TABLE "lineup_entries" DROP CONSTRAINT "FK_lineup_entries_player"`);
        await queryRunner.query(`ALTER TABLE "seasons" ADD "default_home_venue" character varying`);
        await queryRunner.query(`ALTER TABLE "seasons" ADD "default_home_color" character varying`);
        await queryRunner.query(`ALTER TABLE "seasons" ADD "default_away_color" character varying`);
        await queryRunner.query(`ALTER TABLE "games" ADD "is_home_game" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "lineup_entries" ADD "slot_index" integer`);
        
        // Assign slotIndex (0-10) to existing starting lineup entries
        await queryRunner.query(`
            UPDATE lineup_entries 
            SET slot_index = sub.rn - 1
            FROM (
                SELECT id, row_number() OVER (PARTITION BY game_id ORDER BY id) as rn
                FROM lineup_entries
                WHERE status = 'starting'
            ) sub
            WHERE lineup_entries.id = sub.id
        `);
        await queryRunner.query(`ALTER TABLE "seasons" ADD CONSTRAINT "FK_87842d1f24afb9d22f479f73b8c" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "teams" ADD CONSTRAINT "FK_f1cbcfd9d4a42fd2f74dfd228a3" FOREIGN KEY ("sport_id") REFERENCES "sports"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "teams" ADD CONSTRAINT "FK_a1df838977d51a13cc483ba013f" FOREIGN KEY ("coach_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "players" ADD CONSTRAINT "FK_ce457a554d63e92f4627d6c5763" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "games" ADD CONSTRAINT "FK_c02edffc051ed57ca323851d691" FOREIGN KEY ("season_id") REFERENCES "seasons"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "game_events" ADD CONSTRAINT "FK_5e9c9173e6d21d06023146b42e3" FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "lineup_entries" ADD CONSTRAINT "FK_e4d7506842644d3e54ebe30bd91" FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "lineup_entries" ADD CONSTRAINT "FK_c5c4cb9c8bade13d336b3f87278" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "lineup_entries" DROP CONSTRAINT "FK_c5c4cb9c8bade13d336b3f87278"`);
        await queryRunner.query(`ALTER TABLE "lineup_entries" DROP CONSTRAINT "FK_e4d7506842644d3e54ebe30bd91"`);
        await queryRunner.query(`ALTER TABLE "game_events" DROP CONSTRAINT "FK_5e9c9173e6d21d06023146b42e3"`);
        await queryRunner.query(`ALTER TABLE "games" DROP CONSTRAINT "FK_c02edffc051ed57ca323851d691"`);
        await queryRunner.query(`ALTER TABLE "players" DROP CONSTRAINT "FK_ce457a554d63e92f4627d6c5763"`);
        await queryRunner.query(`ALTER TABLE "teams" DROP CONSTRAINT "FK_a1df838977d51a13cc483ba013f"`);
        await queryRunner.query(`ALTER TABLE "teams" DROP CONSTRAINT "FK_f1cbcfd9d4a42fd2f74dfd228a3"`);
        await queryRunner.query(`ALTER TABLE "seasons" DROP CONSTRAINT "FK_87842d1f24afb9d22f479f73b8c"`);
        await queryRunner.query(`ALTER TABLE "lineup_entries" DROP COLUMN "slot_index"`);
        await queryRunner.query(`ALTER TABLE "games" DROP COLUMN "is_home_game"`);
        await queryRunner.query(`ALTER TABLE "seasons" DROP COLUMN "default_away_color"`);
        await queryRunner.query(`ALTER TABLE "seasons" DROP COLUMN "default_home_color"`);
        await queryRunner.query(`ALTER TABLE "seasons" DROP COLUMN "default_home_venue"`);
        await queryRunner.query(`ALTER TABLE "lineup_entries" ADD CONSTRAINT "FK_lineup_entries_player" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "lineup_entries" ADD CONSTRAINT "FK_lineup_entries_game" FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "game_events" ADD CONSTRAINT "FK_game_events_game" FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "games" ADD CONSTRAINT "FK_games_season" FOREIGN KEY ("season_id") REFERENCES "seasons"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "players" ADD CONSTRAINT "FK_players_team" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "teams" ADD CONSTRAINT "FK_teams_coach" FOREIGN KEY ("coach_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "teams" ADD CONSTRAINT "FK_teams_sport" FOREIGN KEY ("sport_id") REFERENCES "sports"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "seasons" ADD CONSTRAINT "FK_seasons_team" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
