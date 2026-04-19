import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOpponentGoalEvent1776580000000 implements MigrationInterface {
  name = 'AddOpponentGoalEvent1776580000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Get existing events for Soccer
    const result = await queryRunner.query(
      `SELECT "event_definitions" FROM "sports" WHERE "name" = 'Soccer'`,
    );

    if (result.length > 0) {
      const events = result[0].event_definitions;
      
      // Check if OPPONENT_GOAL already exists
      if (!events.find((e: any) => e.type === 'OPPONENT_GOAL')) {
        events.push({
          type: 'OPPONENT_GOAL',
          payloadSchema: {
            type: 'object',
            properties: {},
            additionalProperties: false
          }
        });

        await queryRunner.query(
          `UPDATE "sports" SET "event_definitions" = $1 WHERE "name" = 'Soccer'`,
          [JSON.stringify(events)]
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const result = await queryRunner.query(
      `SELECT "event_definitions" FROM "sports" WHERE "name" = 'Soccer'`,
    );

    if (result.length > 0) {
      const events = result[0].event_definitions;
      const filtered = events.filter((e: any) => e.type !== 'OPPONENT_GOAL');

      await queryRunner.query(
        `UPDATE "sports" SET "event_definitions" = $1 WHERE "name" = 'Soccer'`,
        [JSON.stringify(filtered)]
      );
    }
  }
}
