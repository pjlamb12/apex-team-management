import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLeagueToGuestPlayers1784300000000 implements MigrationInterface {
  name = 'AddLeagueToGuestPlayers1784300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "players" ADD "league_id" uuid
    `);
    await queryRunner.query(`
      ALTER TABLE "players" ADD CONSTRAINT "FK_players_league" FOREIGN KEY ("league_id") REFERENCES "leagues"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "players" DROP CONSTRAINT "FK_players_league"
    `);
    await queryRunner.query(`
      ALTER TABLE "players" DROP COLUMN "league_id"
    `);
  }
}
