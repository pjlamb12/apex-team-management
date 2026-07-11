import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIgnorePlayingTimeAndGuestPlayers1784200000000 implements MigrationInterface {
  name = 'AddIgnorePlayingTimeAndGuestPlayers1784200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "events" ADD "ignore_playing_time" boolean NOT NULL DEFAULT false
    `);
    await queryRunner.query(`
      ALTER TABLE "players" ADD "is_guest" boolean NOT NULL DEFAULT false
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "players" DROP COLUMN "is_guest"
    `);
    await queryRunner.query(`
      ALTER TABLE "events" DROP COLUMN "ignore_playing_time"
    `);
  }
}
