import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedVolleyballSport1782900000000 implements MigrationInterface {
  name = 'SeedVolleyballSport1782900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "sports" ("name", "position_types", "is_enabled", "event_definitions")
      VALUES (
        'Volleyball',
        '["Setter", "Outside Hitter", "Opposite Hitter", "Middle Blocker", "Libero", "Defensive Specialist"]'::jsonb,
        true,
        '[]'::jsonb
      )
      ON CONFLICT ("name") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "sports" WHERE "name" = 'Volleyball'
    `);
  }
}
