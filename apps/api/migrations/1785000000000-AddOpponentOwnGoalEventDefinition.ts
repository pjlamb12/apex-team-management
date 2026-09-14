import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOpponentOwnGoalEventDefinition1785000000000 implements MigrationInterface {
  name = 'AddOpponentOwnGoalEventDefinition1785000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const result = await queryRunner.query(
      `SELECT "event_definitions" FROM "sports" WHERE "name" = 'Soccer'`,
    );

    if (result.length > 0) {
      const events = result[0].event_definitions;

      if (!events.find((e: any) => e.type === 'OPPONENT_OWN_GOAL')) {
        events.push({
          type: 'OPPONENT_OWN_GOAL',
          payloadSchema: {
            type: 'object',
            properties: {},
            additionalProperties: true,
          },
        });

        await queryRunner.query(
          `UPDATE "sports" SET "event_definitions" = $1 WHERE "name" = 'Soccer'`,
          [JSON.stringify(events)],
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
      const filtered = events.filter((e: any) => e.type !== 'OPPONENT_OWN_GOAL');

      await queryRunner.query(
        `UPDATE "sports" SET "event_definitions" = $1 WHERE "name" = 'Soccer'`,
        [JSON.stringify(filtered)],
      );
    }
  }
}
